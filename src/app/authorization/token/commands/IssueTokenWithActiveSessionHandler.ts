import { AuthClientFactory, EventPublisher } from "~/domain/adapters"
import { Session, User } from "~/domain/entities"
import { AuthenticationError, AuthorizationError, commonErrors, InvalidOperationError } from "~/domain/errors"
import { AuthenticationEvent, AuthorizationEvent, SessionEvent } from "~/domain/events"
import { IdentityProviderRepository, SessionRepository, UserRepository } from "~/domain/repositories"
import { SessionConfig } from "~/infrastructure/config"
import { AuthorizationService } from "./AuthorizationService"

export interface IssueTokenWithActiveSessionInput {
  sessionId: string
  nonce: string
  userToImpersonateId?: string
  audience?: string
  scope?: string
}

export interface IssueTokenWithActiveSessionResult {
  accessToken: string
  expiresIn: number
}

export class IssueTokenWithActiveSessionHandler {
  constructor(
    private readonly authClientFactory: AuthClientFactory,
    private readonly authorizationService: AuthorizationService,
    private readonly identityProviderRepository: IdentityProviderRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly sessionConfig: SessionConfig,
    private readonly userRepository: UserRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: IssueTokenWithActiveSessionInput): Promise<IssueTokenWithActiveSessionResult> {
    const session = await this.getSession(command.sessionId, command.nonce)
    let user = await this.authenticateUser(session)

    let impersonatedByUser: User | undefined
    if (command.userToImpersonateId) {
      impersonatedByUser = user
      user = await this.getUserToImpersonate(command.userToImpersonateId)

      if (!impersonatedByUser.canImpersonateUser(user)) {
        this.eventPublisher.publishEvent(AuthorizationEvent.impersonationFailed(impersonatedByUser, user, session))
        throw new AuthorizationError(commonErrors.impersonationNotAllowed)
      }
    }

    return await this.authorizationService.issueAccessToken(
      user,
      impersonatedByUser,
      session,
      command.audience,
      command.scope,
    )
  }

  private async authenticateUser(session: Session) {
    const user = await this.userRepository.tryGetById(session.userId)
    if (!user) {
      this.eventPublisher.publishEvent(AuthenticationEvent.activeSessionFailed(session))
      throw new AuthenticationError(commonErrors.authenticationFailed)
    }

    if (!user.canSignInWithActiveSession()) {
      this.eventPublisher.publishEvent(AuthenticationEvent.activeSessionMethodNotAllowed(session))
      throw new AuthenticationError(commonErrors.authenticationMethodNotAllowed)
    }

    this.eventPublisher.publishEvent(AuthenticationEvent.activeSessionSuccess(session))
    return user
  }

  private async getUserToImpersonate(userToImpersonateId: string) {
    const userToImpersonate = await this.userRepository.tryGetById(userToImpersonateId)
    if (!userToImpersonate) {
      throw new InvalidOperationError(`User with id ${userToImpersonateId} not found`)
    }

    return userToImpersonate
  }

  private async getSession(sessionId: string, nonce: string) {
    const session = await this.sessionRepository.tryGetById(sessionId)
    if (!session) {
      throw new AuthenticationError(commonErrors.sessionExpired)
    }

    if (!session.isActive) {
      this.eventPublisher.publishEvent(AuthenticationEvent.activeSessionExpired(session))
      throw new AuthenticationError(commonErrors.sessionExpired)
    }

    if (session.nonce !== nonce) {
      this.eventPublisher.publishEvent(SessionEvent.nonceMismatchDetected(session))
      throw new AuthenticationError(commonErrors.sessionInvalid)
    }

    await this.refreshSession(session)
    return session
  }

  private async refreshSession(session: Session) {
    if (!session.isActive) {
      this.eventPublisher.publishEvent(AuthenticationEvent.activeSessionExpired(session))
      throw new AuthenticationError(commonErrors.sessionExpired)
    }

    // To avoid calling the IDP unnecessarily, we configure a minimum period between refreshes.
    // However, note that the longer this period is, the longer a user can use access tokens
    // after a session has been terminated (e.g. revoked by IDP).
    const isSessionRefreshDue = session.isIdentityProviderRefreshDue(this.sessionConfig.minSessionRefreshDelayMinutes)
    if (!isSessionRefreshDue || !session.identityProviderId || !session.refreshToken) {
      session.setLastRefresh()
      await this.sessionRepository.update(session)
      this.eventPublisher.publishEvent(SessionEvent.sessionRefreshed(session))
      return
    }

    // If the session has a refresh token from the IDP, we use the refresh token to get
    // a new ID and refresh token from the IDP. Although we don't actually need a new
    // access token, the purpose of this is to check that the session is still active
    // on the IDP and the user has not revoked access.
    const identityProvider = await this.identityProviderRepository.getById(session.identityProviderId)
    const client = this.authClientFactory.createClient(identityProvider)
    const result = await client.checkSessionWithRefreshToken(session.refreshToken!)
    if (result.valid) {
      session.setLastRefresh(result.idToken, result.refreshToken)
      await this.sessionRepository.update(session)
      this.eventPublisher.publishEvent(SessionEvent.sessionRefreshed(session))
    } else {
      session.terminateSessionByIdentityProvider()
      await this.sessionRepository.update(session)
      this.eventPublisher.publishEvent(SessionEvent.sessionTerminatedByIdentityProvider(session))
    }
  }
}
