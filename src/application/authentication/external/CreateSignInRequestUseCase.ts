import { IdentityProviderRepository } from "~/domain/repositories"
import { AuthClientFactory, SignInState } from "~/domain/adapters"

export interface CreateSignInRequestInput {
  identityProviderName: string
  redirectUrl: string
}

export interface CreateSignInRequestOutput {
  url: string
  signInState: SignInState
}

export class CreateSignInRequestUseCase {
  constructor(
    private readonly authClientFactory: AuthClientFactory,
    private readonly identityProviderRepository: IdentityProviderRepository,
  ) {}

  async execute(input: CreateSignInRequestInput): Promise<CreateSignInRequestOutput> {
    const idp = await this.identityProviderRepository.getByName(input.identityProviderName)
    idp.verifyRedirectUrl(input.redirectUrl)
    
    const client = this.authClientFactory.createClient(idp)
    return await client.createSignInRequest(input.redirectUrl)
  }
}
