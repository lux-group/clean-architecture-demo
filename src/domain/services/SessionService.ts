import { CreateSessionProps, Session } from "~/domain/entities"
import { AuthenticationError, commonErrors } from "~/domain/errors"
import { AuthClientFactory, EventPublisher, SignInResponse } from "~/domain/adapters"
import { IdentityProviderRepository, SessionRepository } from "~/domain/repositories"
import { SessionEvent } from "~/domain/events"

interface SessionConfig {
  readonly localSessionLifetimeHours: number
  readonly externalSessionLifetimeHours: number
  readonly minSessionRefreshDelayMinutes: number
}

export class SessionService {
  constructor(
    private readonly eventPublisher: EventPublisher,
    private readonly authClientFactory: AuthClientFactory,
    private readonly identityProviderRepository: IdentityProviderRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly sessionConfig: SessionConfig,
  ) {}

  async getActiveSessionById(id: string, nonce: string) {
    const session = await this.sessionRepository.tryGetById(id)
    if (!session) {
      throw new AuthenticationError(commonErrors.sessionExpired)
    }

    session.ensureIsActive()

    if (session.nonce != nonce) {
      this.publishWarningEvent("Nonce mismatch indicating potential session hijacking attempt", {
        activity: "Session validation failed",
        sessionId: session.id,
        userId: session.userId,
        identityProviderId: session.identityProviderId ?? undefined,
      })

      throw new AuthenticationError(commonErrors.sessionInvalid)
    } 

    return session
  }

  async tryGetSessionByIdentityProviderSessionId(sid: string) {
    return await this.sessionRepository.tryGetByIdentityProviderSessionId(sid)
  }

  async startLocalSession(userId: string) {
    const props: CreateSessionProps = {
      userId,
      identityProviderId: null,
      identityProviderSessionId: null,
      idToken: null,
      refreshToken: null,
    }

    const session = Session.createNew(props, this.sessionConfig.localSessionLifetimeHours)
    await this.sessionRepository.insert(session)

    this.publishSuccessEvent({
      activity: "Session created",
      sessionId: session.id,
      userId
    })

    return session
  }

  async startIdentityProviderSession(userId: string, identityProviderId: string, signInResponse: SignInResponse) {
    const props: CreateSessionProps = {
      userId,
      identityProviderId,
      identityProviderSessionId: signInResponse.sessionId ?? null,
      idToken: signInResponse.idToken,
      refreshToken: signInResponse.refreshToken ?? null,
    }

    const session = Session.createNew(props, this.sessionConfig.externalSessionLifetimeHours)
    await this.sessionRepository.insert(session)

    this.publishSuccessEvent({
      activity: "Session created",
      sessionId: session.id,
      userId,
      identityProviderId
    })

    return session
  }

  async terminateLocalSessionByUser(session: Session) {
    session.terminateLocalSessionByUser()
    await this.sessionRepository.update(session)

    this.publishSuccessEvent({
      activity: "Session terminated by user",
      sessionId: session.id,
      userId: session.userId
    })
  }
  
  async terminateIdentityProviderSessionByUser(session: Session) {
    session.terminateIdentityProviderSessionByUser()
    await this.sessionRepository.update(session)
    
    this.publishSuccessEvent({
      activity: "Session terminated by user",
      sessionId: session.id,
      userId: session.userId,
      identityProviderId: session.identityProviderId ?? undefined
    })
  }

  async terminateSessionByIdentityProvider(session: Session) {
    session.terminateSessionByIdentityProvider()
    await this.sessionRepository.update(session)

    this.publishSuccessEvent({
      activity: "Session terminated by identity provider",
      sessionId: session.id,
      userId: session.userId,
      identityProviderId: session.identityProviderId ?? undefined
    })
  }

  async refreshSession(session: Session) {
    session.ensureIsActive()

    // To avoid calling the IDP unnecessarily, we configure a minimum period between refreshes.
    // However, note that the longer this period is, the longer a user can use access tokens
    // after a session has been terminated (e.g. revoked by IDP).
    const isSessionRefreshDue = session.isIdentityProviderRefreshDue(this.sessionConfig.minSessionRefreshDelayMinutes)
    if (!isSessionRefreshDue || !session.identityProviderId || !session.refreshToken) {
      await this.setLastSessionRefresh(session)
      return session
    }

    // If the session has a refresh token from the IDP, we use the refresh token to get
    // a new ID and refresh token from the IDP. Although we don't actually need a new
    // access token, the purpose of this is to check that the session is still active
    // on the IDP and the user has not revoked access.
    const identityProvider = await this.identityProviderRepository.getById(session.identityProviderId)
    const client = this.authClientFactory.createClient(identityProvider)
    const result = await client.checkSessionWithRefreshToken(session.refreshToken!)

    if (result.valid) {
      await this.setLastSessionRefresh(session, result.idToken, result.refreshToken)
    } else {
      await this.terminateSessionByIdentityProvider(session)
    }
  
    return session
  }

  private async setLastSessionRefresh(session: Session, idToken?: string, refreshToken?: string) {
    session.setLastRefresh(idToken, refreshToken)
    await this.sessionRepository.update(session)

    this.publishSuccessEvent({
      activity: "Session refreshed",
      sessionId: session.id,
      userId: session.userId,
      identityProviderId: session.identityProviderId ?? undefined,
    })
  }

  private publishSuccessEvent(details: SessionEvent["details"]) {
    this.eventPublisher.publishEvent("Session", {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      result: "Success",
      details,
    })
  }

  private publishWarningEvent(reason: string, details: SessionEvent["details"]) {
    this.eventPublisher.publishEvent("Session", {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      result: "Warning",
      reason,
      details,
    })
  }
}
