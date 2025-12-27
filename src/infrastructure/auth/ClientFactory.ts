import { AuthClient, AuthClientFactory } from '~/application/ports';
import { IdentityProvider, IdentityProviderType } from '~/domain/entities';
import { InvalidOperationError } from '~/domain/errors';
import { AppleClient } from './AppleClient';
import { FacebookClient } from './FacebookClient';
import { OidcClient } from './OidcClient';

export class ClientFactory implements AuthClientFactory {
  constructor(private readonly baseUrl: string) {}

  createClient(identityProvider: IdentityProvider): AuthClient {
    if (!identityProvider.authSettings) {
      throw InvalidOperationError.identityProviderHasNoAuthSettings(identityProvider.id);
    }

    switch (identityProvider.authSettings.type) {
      case IdentityProviderType.Entra:
        return new OidcClient(this.baseUrl, identityProvider, true);
      case IdentityProviderType.Google:
        return new OidcClient(this.baseUrl, identityProvider, false);
      case IdentityProviderType.Apple:
        return new AppleClient(this.baseUrl, identityProvider);
      case IdentityProviderType.Facebook:
        return new FacebookClient(this.baseUrl, identityProvider);
      default:
        throw new Error('Unsupported identity provider type');
    }
  }
}
