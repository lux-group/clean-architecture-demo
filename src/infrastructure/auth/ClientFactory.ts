import { InvalidOperationError } from "~/domain/errors"
import { IdentityProvider, IdentityProviderType } from "~/domain/entities"
import { AuthClient, AuthClientFactory } from "~/domain/adapters"
import { OidcClient } from "./OidcClient"
import { FacebookClient } from "./FacebookClient"
import { AppleClient } from "./AppleClient"

export class ClientFactory implements AuthClientFactory {
  constructor(private readonly baseUrl: string) {}

  createClient(identityProvider: IdentityProvider): AuthClient {
    if (!identityProvider.authSettings) {
      throw new InvalidOperationError("The identity provider is not configured for authentication.")
    }

    switch (identityProvider.authSettings.type) {
      case IdentityProviderType.Entra:
        return new OidcClient(this.baseUrl, identityProvider, true)
      case IdentityProviderType.Google:
        return new OidcClient(this.baseUrl, identityProvider, false)
      case IdentityProviderType.Apple:
        return new AppleClient(this.baseUrl, identityProvider)
      case IdentityProviderType.Facebook:
        return new FacebookClient(this.baseUrl, identityProvider)
      default:
        throw new InvalidOperationError("Unsupported identity provider type")
    }
  }
}
