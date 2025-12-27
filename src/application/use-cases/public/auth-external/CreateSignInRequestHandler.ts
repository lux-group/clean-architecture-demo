import { AuthClientFactory, SignInState } from '~/application/ports';
import { IdentityProvider } from '~/domain/entities';
import { InvalidOperationError } from '~/domain/errors';
import { IdentityProviderRepository } from '~/domain/repositories';

export interface CreateSignInRequestCommand {
  identityProviderName: string;
  redirectUrl: string;
}

export interface CreateSignInRequestResult {
  url: string;
  signInState: SignInState;
}

export class CreateSignInRequestHandler {
  constructor(
    private readonly authClientFactory: AuthClientFactory,
    private readonly identityProviderRepository: IdentityProviderRepository,
  ) {}

  async execute(command: CreateSignInRequestCommand): Promise<CreateSignInRequestResult> {
    const idp = await this.identityProviderRepository.tryGetByName(command.identityProviderName);
    if (!idp) {
      throw InvalidOperationError.identityProviderNotFound(command.identityProviderName);
    }

    IdentityProvider.verifyRedirectUrl(idp, command.redirectUrl);

    const client = this.authClientFactory.createClient(idp);
    return await client.createSignInRequest(command.redirectUrl);
  }
}
