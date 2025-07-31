import { User, Session } from "~/domain/entities"
import { AuthorizationError, commonErrors } from "~/domain/errors"
import { AuthorizationEvent } from "~/domain/events"
import { SigningKeyRepository } from "~/domain/repositories"
import { EventPublisher, TokenIssuer, TokenResponse } from "~/domain/adapters"

export class AuthorizationService {
  constructor(
    private readonly signingKeyRepository: SigningKeyRepository,
    private readonly tokenIssuer: TokenIssuer,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async issueAccessToken(user: User, impersonatedByUser?: User, session?: Session, audience?: string, scope?: string): Promise<TokenResponse> {
    const signingKey = await this.signingKeyRepository.tryGetActiveSigningKey()
    if (!signingKey || !signingKey.privateKey) {
      throw new Error("No active signing key found.")
    }

    if (audience) {
      throw new AuthorizationError("OAuth2 parameter 'audience' is not supported.")
    }

    if (scope) {
      throw new AuthorizationError("OAuth2 parameter 'scope' is not supported.")
    }

    // Handle user impersonation.
    if (impersonatedByUser && !impersonatedByUser.canImpersonateUser(user)) {
      this.publishImpersonationFailedEvent(impersonatedByUser, user, session)
      throw new AuthorizationError(commonErrors.impersonationNotAllowed)
    }

    const claims = {
      brand: user.brand,
      roles: user.roles,
      impersonated_by_sub: impersonatedByUser?.id
    }

    this.publishTokenIssuedEvent(session, claims)

    return this.tokenIssuer.createAccessToken(user, signingKey, {
      sessionId: session?.id,
      audience,
      claims
    })
  }

  private publishTokenIssuedEvent(session?: Session, claims?: Record<string, unknown>) {
    this.publishSuccessEvent({
      sessionId: session?.id,
      userId: session?.userId,
      claims
    })
  }

  private publishImpersonationFailedEvent(impersonatedByUser: User, user: User, session?: Session) {
    this.publishFailedEvent(commonErrors.impersonationNotAllowed, {
      sessionId: session?.id,
      userId: impersonatedByUser.id,
      userToImpersonateId: user.id,
    })
  }

  private publishSuccessEvent(details: AuthorizationEvent["details"]) {
    this.eventPublisher.publishEvent("Authorization", {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      result: "Success",
      details,
    })
  }

  private publishFailedEvent(reason: string, details: AuthorizationEvent["details"]) {
    this.eventPublisher.publishEvent("Authorization", {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      result: "Failed",
      reason,
      details,
    })
  }
}
