import { IdentityProviderRepository } from "~/domain/repositories"
import { AuthClientFactory, SignInState } from "~/domain/adapters"
import { InvalidOperationError } from "~/domain/errors"

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
    const idp = await this.identityProviderRepository.tryGetByName(input.identityProviderName)
    if (!idp) {
      throw new InvalidOperationError(`Identity provider with name ${input.identityProviderName} not found`)
    }

    idp.verifyRedirectUrl(input.redirectUrl)
    
    const client = this.authClientFactory.createClient(idp)
    return await client.createSignInRequest(input.redirectUrl)
  }
}
