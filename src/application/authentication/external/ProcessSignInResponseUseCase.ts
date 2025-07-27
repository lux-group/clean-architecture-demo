import { Session } from "~/domain/entities"
import { AuthClientFactory, SignInState } from "~/domain/adapters"
import { IdentityProviderRepository } from "~/domain/repositories"
import { AuthenticationService, SessionService } from "~/domain/services"

export interface ProcessSignInResponseInput {
  state: SignInState
  url: string
}

export class ProcessSignInResponseUseCase {
  constructor(
    private readonly authClientFactory: AuthClientFactory,
    private readonly identityProviderRepository: IdentityProviderRepository,
    private readonly sessionService: SessionService,
    private readonly authenticationService: AuthenticationService,
  ) {}

  async execute(input: ProcessSignInResponseInput): Promise<Session> {
    const idp = await this.identityProviderRepository.getById(input.state.identityProviderId)
    const client = this.authClientFactory.createClient(idp)
    const response = await client.processSignInResponse(input.state, input.url)
    const { user, newIdentity } = await this.authenticationService.authenticateWithExternalIdentity(idp, response.profile)

    // If the user has signed in for the first time, we need to delete all unnecessary
    // user attributes from the Entra ID profile to reduce the amount of PII we store
    // and to avoid having to maintain them.
    if (newIdentity && client.supportsEditProfile && response.accessToken) {
      await client.editProfile(response.accessToken, null, null)
    }

    return await this.sessionService.startIdentityProviderSession(user.id, idp.id, response)
  }
}
