import { IdentityProviderRepository } from "~/domain/repositories"
import { SessionService } from "~/domain/services"
import { AuthClientFactory, SignOutState } from "~/domain/adapters"

export interface CreateSignOutRequestInput {
  sessionId: string
  nonce: string
  redirectUrl: string
}

export interface CreateSignOutRequestOutput {
  url: string
  signOutState?: SignOutState
}

export class CreateSignOutRequestUseCase {
  constructor(
    private readonly authClientFactory: AuthClientFactory,
    private readonly identityProviderRepository: IdentityProviderRepository,
    private readonly sessionService: SessionService,
  ) {}

  async execute(input: CreateSignOutRequestInput): Promise<CreateSignOutRequestOutput> {
    const session = await this.sessionService.getActiveSessionById(input.sessionId, input.nonce)
    await this.sessionService.terminateIdentityProviderSessionByUser(session)

    const idp = await this.identityProviderRepository.getById(session.identityProviderId!)
    idp.verifyRedirectUrl(input.redirectUrl)

    const client = this.authClientFactory.createClient(idp)
    if (client.supportsSignOut) {
      return await client.createSignOutRequest(input.redirectUrl, session.idToken!)
    }

    return { url: input.redirectUrl }
  }
}
