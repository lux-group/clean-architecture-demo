import { AuthenticationError, commonErrors } from "~/domain/errors"
import { IdentityProvider, Session, User, UserIdentity } from "~/domain/entities"
import { UserRepository } from "~/domain/repositories"
import { EventPublisher, PasswordVerifier, Profile, TokenValidator } from "~/domain/adapters"
import { AuthenticationEvent } from "~/domain/events"

export class AuthenticationService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventPublisher: EventPublisher,
    private readonly passwordVerifier: PasswordVerifier,
    private readonly tokenValidator: TokenValidator,
  ) {}

  async authenticateWithActiveSession(session: Session): Promise<User> {
    if (!session.isActive) {
      this.publishFailedEvent(commonErrors.sessionExpired, {
        method: "Active Session",
        userId: session.userId,
        sessionId: session.id
      })

      throw new AuthenticationError(commonErrors.sessionExpired)
    }

    const user = await this.userRepository.tryGetById(session.userId)
    if (!user) {
      this.publishFailedEvent(commonErrors.authenticationFailed, {
        method: "Active Session",
        userId: session.userId,
        sessionId: session.id
      })

      throw new AuthenticationError(commonErrors.authenticationFailed)
    }

    if (!user.canSignInWithActiveSession()) {
      this.publishFailedEvent(commonErrors.authenticationMethodNotAllowed, {
        method: "Active Session",
        userId: user.id,
        sessionId: session.id
      })

      throw new AuthenticationError(commonErrors.authenticationMethodNotAllowed)
    }

    this.publishSuccessEvent({
      method: "Active Session",
      userId: user.id,
      sessionId: session.id
    })

    return user
  }

  async authenticateWithEmailAndPassword(brand: string, email: string, password: string): Promise<User> {
    const user = await this.userRepository.tryGetByBrandAndEmail(brand, email)
    if (!user) {
      this.publishFailedEvent(commonErrors.authenticationFailed, {
        method: "Password"
      })

      throw new AuthenticationError(commonErrors.authenticationFailed)
    }

    if (!user.canSignInWithPassword()) {
      this.publishFailedEvent(commonErrors.authenticationMethodNotAllowed, {
        method: "Password",
        userId: user.id
      })

      throw new AuthenticationError(commonErrors.authenticationMethodNotAllowed)
    }

    if (!user.passwordHash || !this.passwordVerifier.verifyPassword(password, user.passwordHash)) {
      user.handleFailedSignInAttempt()
      this.publishFailedEvent(commonErrors.authenticationFailed, {
        method: "Password",
        userId: user.id
      })

      throw new AuthenticationError(commonErrors.authenticationFailed)
    }

    this.publishSuccessEvent({
      method: "Password",
      userId: user.id
    })

    return user
  }

  async authenticateWithClientCredentials(clientId: string, clientSecret: string): Promise<User> {
    const user = await this.userRepository.tryGetById(clientId)
    if (!user) {
      this.publishFailedEvent(commonErrors.authenticationFailed, {
        method: "Client Credentials",
        userId: clientId
      })

      throw new AuthenticationError(commonErrors.authenticationFailed)
    }

    if (!user.canSignInWithClientSecret()) {
      this.publishFailedEvent(commonErrors.authenticationMethodNotAllowed, {
        method: "Client Credentials",
        userId: clientId
      })

      throw new AuthenticationError(commonErrors.authenticationMethodNotAllowed)
    }

    if (!user.passwordHash || !this.passwordVerifier.verifyPassword(clientSecret, user.passwordHash)) {
      user.handleFailedSignInAttempt()
      this.publishFailedEvent(commonErrors.authenticationFailed, {
        method: "Client Credentials",
        userId: user.id
      })

      throw new AuthenticationError(commonErrors.authenticationFailed)
    }

    this.publishSuccessEvent({
      method: "Client Credentials",
      userId: user.id
    })

    return user
  }

  async authenticateWithExternalIdentityToken(identityToken: string): Promise<User> {
    let identityProvider: IdentityProvider
    let profile: Profile

    try {
      const result = await this.tokenValidator.decodeAndValidateToken(identityToken)
      identityProvider = result.identityProvider
      profile = result.profile
    } catch (error) {
      this.publishFailedEvent(commonErrors.authenticationFailed, {
        method: "Identity Provider"
      })

      throw new AuthenticationError(commonErrors.authenticationFailed)
    }

    const { user } = await this.authenticateWithExternalIdentity(identityProvider, profile)
    return user
  }

  async authenticateWithExternalIdentity(idp: IdentityProvider, profile: Profile): Promise<{ user: User, newIdentity?: UserIdentity }> {
    const identityProviderId = idp.id
    const identifierClaimValue = profile.identifierClaimValue

    let user = await this.userRepository.tryGetByExternalIdentity(identityProviderId, identifierClaimValue)
    let newIdentity: UserIdentity | undefined

    if (!user && idp.authSettings) {
      // If the user cannot be found by the linked identity, check if we can find an existing user
      // with the same email address (Entra ID verifies email addresses) and if we find one, link
      // it automatically if this option is enabled for the IDP. This is useful data migration of
      // existing services but should not be used by new services.
      if (idp.authSettings.autoLinkUsers) {
        user = await this.userRepository.tryGetByBrandAndEmail(idp.authSettings.brand, profile.email)
        if (user) {
          newIdentity = user.addIdentity(identityProviderId, identifierClaimValue)
          await this.userRepository.update(user)
        }
      }

      // if the user still doesn't exist, we automatically create it (if enabled for the IDP).
      if (!user && idp.authSettings.autoCreateUsers) {
        user = User.createNew({
          isEnabled: true,
          brand: idp.authSettings.brand,
          givenName: profile.givenName,
          surname: profile.surname,
          email: profile.email,
          emailVerified: true,
          phone: null,
          country: null,
          city: null,
          postcode: null,
          roles: [],
          passwordHash: null,
        })

        newIdentity = user.addIdentity(identityProviderId, identifierClaimValue)
        await this.userRepository.insert(user)
      }
    }

    if (!user) {
      this.publishFailedEvent(commonErrors.authenticationFailed, {
        method: "Identity Provider",
        identityProviderId,
        identifierClaimValue
      })
      throw new AuthenticationError(commonErrors.authenticationFailed)
    }

    if (!user.canSignInWithIdentityProvider()) {
      this.publishFailedEvent(commonErrors.authenticationMethodNotAllowed, {
        method: "Identity Provider",
        userId: user.id,
        identityProviderId,
        identifierClaimValue
      })

      throw new AuthenticationError(commonErrors.authenticationMethodNotAllowed)
    }

    this.publishSuccessEvent({
      method: "Identity Provider",
      userId: user.id,
      identityProviderId,
      identifierClaimValue
    })

    return { user, newIdentity }
  }

  private publishSuccessEvent(details: AuthenticationEvent["details"]): void {
    this.eventPublisher.publishEvent({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      category: "Authentication",
      result: "Success",
      details,
    })
  }

  private publishFailedEvent(reason: string, details: AuthenticationEvent["details"]): void {
    this.eventPublisher.publishEvent({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      category: "Authentication",
      result: "Failed",
      reason,
      details,
    })
  }
}
