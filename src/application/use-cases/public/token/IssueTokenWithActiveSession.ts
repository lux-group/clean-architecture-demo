import {
  AuthClientFactory,
  EventPublisher,
  SessionConfig,
  TokenIssuer,
  TokenResponse,
  TokenVersion,
} from '~/application/ports';
import { Session, User } from '~/domain/entities';
import { AuthenticationError, AuthorizationError, InvalidOperationError } from '~/domain/errors';
import { AuthenticationEvent, AuthorizationEvent, SessionEvent } from '~/domain/events';
import { IdentityProviderRepository, SessionRepository, UserRepository } from '~/domain/repositories';
import { AuthenticationService, AuthorizationService } from '~/domain/services';

export interface IssueTokenWithActiveSessionInput {
  version: TokenVersion;
  sessionId: string;
  nonce: string;
  userToImpersonateId?: string;
  audience?: string;
  scope?: string;
}

export type IssueTokenWithActiveSessionResult = TokenResponse;

export type IssueTokenWithActiveSession = ReturnType<typeof issueTokenWithActiveSession>;

export const issueTokenWithActiveSession = (
  authClientFactory: AuthClientFactory,
  authenticationService: AuthenticationService,
  authorizationService: AuthorizationService,
  eventPublisher: EventPublisher,
  identityProviderRepository: IdentityProviderRepository,
  sessionConfig: SessionConfig,
  sessionRepository: SessionRepository,
  tokenIssuer: TokenIssuer,
  userRepository: UserRepository,
) => {
  const authenticate = async (session: Session) => {
    const user = await userRepository.tryGetById(session.userId);
    return authenticationService.authenticateWithActiveSession(user, session);
  };

  const getUserToImpersonate = async (userToImpersonateId: string) => {
    const userToImpersonate = await userRepository.tryGetById(userToImpersonateId);
    if (!userToImpersonate) {
      throw InvalidOperationError.userNotFound(userToImpersonateId);
    }

    return userToImpersonate;
  };

  const getSession = async (sessionId: string, nonce: string) => {
    let session = await sessionRepository.tryGetById(sessionId);
    if (!session) {
      throw InvalidOperationError.sessionNotFound(sessionId);
    }

    Session.ensureIsActive(session);
    Session.verifyNonce(session, nonce);

    session = await refreshSession(session);
    Session.ensureIsActive(session);

    return session;
  };

  const refreshSession = async (session: Session) => {
    // To avoid calling the IDP unnecessarily, we configure a minimum period between refreshes.
    // However, note that the longer this period is, the longer a user can use access tokens
    // after a session has been terminated (e.g. revoked by IDP).
    const isSessionRefreshDue = Session.isIdentityProviderRefreshDue(
      session,
      sessionConfig.minSessionRefreshDelayMinutes,
    );
    if (!isSessionRefreshDue || !session.identityProviderId || !session.refreshToken) {
      const refreshed = Session.setLastRefresh(session);
      await sessionRepository.update(refreshed);
      eventPublisher.publishEvent(SessionEvent.sessionRefreshed(refreshed));
      return refreshed;
    }

    // If the session has a refresh token from the IDP, we use the refresh token to get
    // a new ID and refresh token from the IDP. Although we don't actually need a new
    // access token, the purpose of this is to check that the session is still active
    // on the IDP and the user has not revoked access.
    const identityProvider = await identityProviderRepository.getById(session.identityProviderId);
    const client = authClientFactory.createClient(identityProvider);
    const result = await client.checkSessionWithRefreshToken(session.refreshToken!);
    if (result.valid) {
      const refreshed = Session.setLastRefresh(session, result.idToken, result.refreshToken);
      await sessionRepository.update(refreshed);
      eventPublisher.publishEvent(SessionEvent.sessionRefreshed(refreshed));
      return refreshed;
    } else {
      const terminated = Session.terminateSessionByIdentityProvider(session);
      await sessionRepository.update(terminated);
      eventPublisher.publishEvent(SessionEvent.sessionTerminatedByIdentityProvider(terminated));
      return terminated;
    }
  };

  return async (command: IssueTokenWithActiveSessionInput): Promise<IssueTokenWithActiveSessionResult> => {
    try {
      const session = await getSession(command.sessionId, command.nonce);
      let user = await authenticate(session);

      let impersonatedByUser: User | undefined;
      if (command.userToImpersonateId) {
        const userToImpersonate = await getUserToImpersonate(command.userToImpersonateId);
        authorizationService.authorizeImpersonation(user, userToImpersonate);

        impersonatedByUser = user;
        user = userToImpersonate;
      }

      // This is where we would do authorization,
      // e.g. check requested audience and scopes.

      const response = await tokenIssuer.createAccessToken({
        version: command.version,
        userId: user.id,
        impersonatedByUserId: impersonatedByUser?.id ?? undefined,
        sessionId: session?.id,
        customClaims: {
          brand: user.brand,
          roles: user.roles,
        },
      });

      eventPublisher.publishEvent(AuthenticationEvent.activeSessionVerified(session.userId, session.id));
      eventPublisher.publishEvent(AuthorizationEvent.tokenIssued(response.claims, session.userId, session.id));

      return response;
    } catch (error: unknown) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        eventPublisher.publishEvent(error.toEvent());
      }

      throw error;
    }
  };
};
