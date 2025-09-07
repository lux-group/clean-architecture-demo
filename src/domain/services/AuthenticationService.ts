import { IdentityProvider, Session, User } from "../entities"
import { AuthenticationError } from "../errors"

type VerifyPassword = (plainText: string, storedHash: string) => boolean

export class AuthenticationService {
  authenticateWithActiveSession(user: User | undefined, session: Session) {
    if (!user) {
      throw AuthenticationError.activeSessionFailed(session.id, undefined, "User not found")
    }

    if (!user.isEnabled) {
      throw AuthenticationError.activeSessionFailed(session.id, user.id, "Account not enabled")
    }

    if (user.isServiceAccount) {
      throw AuthenticationError.activeSessionFailed(session.id, user.id, "Account is a service")
    }

    if (!session.isActive) {
      throw AuthenticationError.activeSessionFailed(session.id, user.id, "Session is not active.")
    }

    if (session.userId !== user.id) {
      throw new Error("User-ID of session does not match this user's ID.")
    }

    return user
  }

  authenticateWithPassword(user: User | undefined, password: string, verifyPassword: VerifyPassword) {
    if (!user) {
      throw AuthenticationError.passwordFailed(undefined, "User not found")
    }

    if (!user.isEnabled) {
      throw AuthenticationError.passwordFailed(user.id, "Account not enabled")
    }

    if (user.isServiceAccount) {
      throw AuthenticationError.passwordFailed(user.id, "Account is a service")
    }

    if (user.identities.length > 0) {
      throw AuthenticationError.passwordFailed(user.id, "Account has external identities")
    }

    if (!user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      user.handleFailedSignInAttempt()
      throw AuthenticationError.passwordFailed(user.id, "Invalid sign-in credentials")
    }

    return user
  }

  authenticateWithClientSecret(user: User | undefined, clientSecret: string, verifyPassword: VerifyPassword) {
    if (!user) {
      throw AuthenticationError.clientCredentialsFailed(undefined, "User not found")
    }

    if (!user.isEnabled) {
      throw AuthenticationError.clientCredentialsFailed(user.id, "Account not enabled")
    }

    if (!user.isServiceAccount) {
      throw AuthenticationError.clientCredentialsFailed(user.id, "Account is not a service")
    }

    if (user.identities.length > 0) {
      throw AuthenticationError.clientCredentialsFailed(user.id, "Account has external identities")
    }

    if (!user.passwordHash || !verifyPassword(clientSecret, user.passwordHash)) {
      user.handleFailedSignInAttempt()
      throw AuthenticationError.clientCredentialsFailed(user.id, "Invalid client credentials.")
    }

    return user
  }

  authenticateWithIdentityProvider(
    user: User | undefined,
    identityProvider: IdentityProvider,
    identifierClaimValue: string,
  ) {
    if (!user) {
      throw AuthenticationError.identityProviderFailed(identityProvider.id, undefined, "User not found")
    }

    if (!user.isEnabled) {
      throw AuthenticationError.identityProviderFailed(identityProvider.id, user.id, "Account not enabled")
    }

    if (user.isServiceAccount) {
      throw AuthenticationError.identityProviderFailed(identityProvider.id, user.id, "Account is a service")
    }

    const identity = user.identities
      .filter(i => i.identityProviderId === identityProvider.id)
      .find(i => i.identifierClaimValue === identifierClaimValue)
    if (!identity) {
      throw AuthenticationError.identityProviderFailed(identityProvider.id, user.id, "Identity not found")
    }

    return user
  }

  authenticateWithExternalToken(
    user: User | undefined,
    identityProvider: IdentityProvider,
    identifierClaimValue: string,
  ) {
    if (!user) {
      throw AuthenticationError.tokenExchangeFailed(identityProvider.id, undefined, "User not found")
    }

    if (!user.isEnabled) {
      throw AuthenticationError.tokenExchangeFailed(identityProvider.id, user.id, "Account not enabled")
    }

    if (!user.isServiceAccount) {
      throw AuthenticationError.tokenExchangeFailed(identityProvider.id, user.id, "Account is not a service")
    }

    const identity = user.identities
      .filter(i => i.identityProviderId === identityProvider.id)
      .find(i => i.identifierClaimValue === identifierClaimValue)
    if (!identity) {
      throw AuthenticationError.tokenExchangeFailed(identityProvider.id, user.id, "Identity not found")
    }

    return user
  }
}
