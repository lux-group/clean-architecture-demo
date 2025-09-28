import { AuthClientFactory, EventPublisher, SessionConfig, SignInState } from "~/app/ports"
import { CreateSessionProps, Session, User } from "~/domain/entities"
import { AuthenticationError } from "~/domain/errors"
import { AuthenticationEvent, EntityChangeEvent, SessionEvent } from "~/domain/events"
import { IdentityProviderRepository, SessionRepository, UserRepository } from "~/domain/repositories"
import { AuthenticationService } from "~/domain/services"

export interface ProcessSignInResponseCommand {
  state: SignInState
  url: string
}

export class ProcessSignInResponseHandler {
  constructor(
    private readonly authClientFactory: AuthClientFactory,
    private readonly authenticationService: AuthenticationService,
    private readonly eventPublisher: EventPublisher,
    private readonly identityProviderRepository: IdentityProviderRepository,
    private readonly sessionConfig: SessionConfig,
    private readonly sessionRepository: SessionRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: ProcessSignInResponseCommand): Promise<Session> {
    try {
      const idp = await this.identityProviderRepository.getById(command.state.identityProviderId)
      const client = this.authClientFactory.createClient(idp)
      const signInResponse = await client.processSignInResponse(command.state, command.url)
      const profile = signInResponse.profile
      const claimValue = profile.identifierClaimValue

      let user = await this.userRepository.tryGetByExternalIdentity(idp.id, claimValue)
      if (!user) {
        // If the user cannot be found by the linked identity, check if we can find an existing
        // user with the same email address (Entra ID verifies email addresses) and if we find one,
        // link it automatically if this option is enabled for the IDP. This is useful data
        // migration of existing services but should not be used by new services.
        if (idp.authSettings!.autoLinkUsers) {
          user = await this.userRepository.tryGetByBrandAndEmail(idp.authSettings!.brand, profile.email)
          if (user) {
            user.addIdentity(idp.id, claimValue)
            await this.userRepository.update(user)

            const event = EntityChangeEvent.entityUpdated("User", user)
            this.eventPublisher.publishEvent(event)
          }
        }

        // If the user still doesn't exist, we automatically create it.
        if (!user && idp.authSettings!.autoCreateUsers) {
          user = User.createNew({
            isEnabled: true,
            brand: idp.authSettings!.brand,
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

          user.addIdentity(idp.id, claimValue)
          await this.userRepository.insert(user)

          const event = EntityChangeEvent.entityCreated("User", user)
          this.eventPublisher.publishEvent(event)
        }

        // Because the user has signed in for the first time, we need to delete all
        // unnecessary user attributes from the Entra ID profile to reduce the amount
        // of PII we store and to avoid having to maintain them.
        if (client.supportsEditProfile && signInResponse.accessToken) {
          await client.editProfile(signInResponse.accessToken, null, null)
        }
      }

      user = this.authenticationService.authenticateWithIdentityProvider(user, idp, claimValue)

      const props: CreateSessionProps = {
        userId: user.id,
        identityProviderId: idp.id,
        identityProviderSessionId: signInResponse.sessionId ?? null,
        idToken: signInResponse.idToken,
        refreshToken: signInResponse.refreshToken ?? null,
      }

      const session = Session.createNew(props, this.sessionConfig.externalSessionLifetimeHours)
      await this.sessionRepository.insert(session)

      this.eventPublisher.publishEvent(AuthenticationEvent.identityProviderCodeVerified(user.id, idp.id, claimValue))
      this.eventPublisher.publishEvent(SessionEvent.sessionCreated(session))

      return session
    } catch (error: unknown) {
      if (error instanceof AuthenticationError) {
        this.eventPublisher.publishEvent(error.toEvent())
      }

      throw error
    }
  }
}
