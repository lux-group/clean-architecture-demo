import { AuthClientFactory, EventPublisher, TokenResponse } from "~/domain/adapters"
import { Session, User } from "~/domain/entities"
import { AuthenticationError, AuthorizationError, InvalidOperationError } from "~/domain/errors"
import { AuthenticationEvent, AuthorizationEvent, SessionEvent } from "~/domain/events"
import { IdentityProviderRepository, SessionRepository, UserRepository } from "~/domain/repositories"
import { AuthenticationService, AuthorizationService } from "~/domain/services"
import { SessionConfig } from "~/infrastructure/config"

export interface IssueTokenWithActiveSessionInput {
  sessionId: string
  nonce: string
  userToImpersonateId?: string
  audience?: string
  scope?: string
}

export type IssueTokenWithActiveSessionResult = TokenResponse

export class IssueTokenWithActiveSessionHandler {
  constructor(
    private readonly authClientFactory: AuthClientFactory,
    private readonly authenticationService: AuthenticationService,
    private readonly authorizationService: AuthorizationService,
    private readonly eventPublisher: EventPublisher,
    private readonly identityProviderRepository: IdentityProviderRepository,
    private readonly sessionConfig: SessionConfig,
    private readonly sessionRepository: SessionRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: IssueTokenWithActiveSessionInput): Promise<IssueTokenWithActiveSessionResult> {
    try {
      const session = await this.getSession(command.sessionId, command.nonce)
      let user = await this.authenticat(session)

      let impersonatedByUser: User | undefined
      if (command.userToImpersonateId) {
        const userToImpersonate = await this.getUserToImpersonate(command.userToImpersonateId)
        this.authorizationService.authorizeImpersonation(user, userToImpersonate)

        impersonatedByUser = user
        user = userToImpersonate
      }

      const response = await this.authorizationService.issueAccessToken(
        user,
        impersonatedByUser,
        session,
        command.audience,
        command.scope,
      )

      this.eventPublisher.publishEvent(AuthenticationEvent.activeSessionVerified(session.userId, session.id))
      this.eventPublisher.publishEvent(AuthorizationEvent.tokenIssued(response.claims, session.userId, session.id))

      return response
    } catch (error: unknown) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        this.eventPublisher.publishEvent(error.toEvent())
      }

      throw error
    }
  }

  private async authenticat(session: Session) {
    const user = await this.userRepository.tryGetById(session.userId)
    return this.authenticationService.authenticateWithActiveSession(user, session)
  }

  private async getUserToImpersonate(userToImpersonateId: string) {
    const userToImpersonate = await this.userRepository.tryGetById(userToImpersonateId)
    if (!userToImpersonate) {
      throw InvalidOperationError.userNotFound(userToImpersonateId)
    }

    return userToImpersonate
  }

  private async getSession(sessionId: string, nonce: string) {
    const session = await this.sessionRepository.tryGetById(sessionId)
    if (!session) {
      throw InvalidOperationError.sessionNotFound(sessionId)
    }

    session.ensureIsActive()
    session.verifyNonce(nonce)

    await this.refreshSession(session)
    session.ensureIsActive()

    return session
  }

  private async refreshSession(session: Session) {
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
