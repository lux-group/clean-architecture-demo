import { TokenIssuer } from "../adapters"
import { Session, User } from "../entities"
import { AuthorizationError } from "../errors"
import { SigningKeyRepository } from "../repositories"

export class AuthorizationService {
  constructor(
    private readonly signingKeyRepository: SigningKeyRepository,
    private readonly tokenIssuer: TokenIssuer,
  ) {}

  async issueAccessToken(user: User, impersonatedByUser?: User, session?: Session, audience?: string, scope?: string) {
    const signingKey = await this.signingKeyRepository.tryGetActiveSigningKey()
    if (!signingKey || !signingKey.privateKey) {
      throw new Error("No active signing key found.")
    }

    if (audience) {
      // The service currently does not support audience-based authorization.
      throw AuthorizationError.unauthorizedAudience(audience, user.id, session?.id)
    }

    if (scope) {
      // The service currently does not support scope-based authorization.
      throw AuthorizationError.unauthorizedScope(scope, user.id, session?.id)
    }

    return this.tokenIssuer.createAccessToken(signingKey, {
      userId: user.id,
      sessionId: session?.id,
      audience,
      customClaims: {
        brand: user.brand,
        roles: user.roles,
        impersonated_by_sub: impersonatedByUser?.id,
      },
    })
  }

  authorizeImpersonation(user: User, userToImpersonate: User) {
    if (userToImpersonate.id === user.id) {
      throw AuthorizationError.impersonationNotAllowed(
        user.id,
        userToImpersonate.id,
        "A user cannot impersonate itself.",
      )
    }

    if (!user.roles.includes("employee")) {
      throw AuthorizationError.impersonationNotAllowed(
        user.id,
        userToImpersonate.id,
        "Only users with the employee role can impersonate other users.",
      )
    }

    if (user.isServiceAccount) {
      throw AuthorizationError.impersonationNotAllowed(
        user.id,
        userToImpersonate.id,
        "Service accounts cannot impersonate users.",
      )
    }

    if (userToImpersonate.isServiceAccount) {
      throw AuthorizationError.impersonationNotAllowed(
        user.id,
        userToImpersonate.id,
        "Users cannot impersonate service accounts.",
      )
    }

    if (userToImpersonate.roles.length > 0) {
      throw AuthorizationError.impersonationNotAllowed(
        user.id,
        userToImpersonate.id,
        "Only users without roles can be impersonated.",
      )
    }
  }
}
