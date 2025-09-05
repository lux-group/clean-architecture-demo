import { AuthClientFactory, SignOutState } from "~/domain/adapters"
import { IdentityProviderRepository } from "~/domain/repositories"
import { SessionService } from "~/domain/services"

export interface CreateSignOutRequestCommand {
  sessionId: string
  nonce: string
  redirectUrl: string
}

export interface CreateSignOutRequestResult {
  url: string
  signOutState?: SignOutState
}

export class CreateSignOutRequestHandler {
  constructor(
    private readonly authClientFactory: AuthClientFactory,
    private readonly identityProviderRepository: IdentityProviderRepository,
    private readonly sessionService: SessionService,
  ) {}

  async execute(command: CreateSignOutRequestCommand): Promise<CreateSignOutRequestResult> {
    const session = await this.sessionService.getActiveSessionById(command.sessionId, command.nonce)
    await this.sessionService.terminateIdentityProviderSessionByUser(session)

    const idp = await this.identityProviderRepository.getById(session.identityProviderId!)
    idp.verifyRedirectUrl(command.redirectUrl)

    const client = this.authClientFactory.createClient(idp)
    if (client.supportsSignOut) {
      return await client.createSignOutRequest(command.redirectUrl, session.idToken!)
    }

    return { url: command.redirectUrl }
  }
}
