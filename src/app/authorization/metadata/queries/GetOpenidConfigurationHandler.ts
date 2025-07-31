import { TokenIssuerConfig } from "~/domain/adapters/TokenIssuer"

export class GetOpenidConfigurationHandler {
  constructor(
    private readonly baseUrl: string,
    private readonly tokenIssuerConfig: TokenIssuerConfig,
  ) {}

  async execute(): Promise<object> {
    const issuer = this.baseUrl + this.tokenIssuerConfig.path
    const metadata = {
      issuer,
      jwks_uri: issuer + "/.well-known/jwks",
      token_endpoint: issuer + "/token",
      subject_types_supported: [ "public" ],
      id_token_signing_alg_values_supported: [ "RS256" ],
      response_types_supported: [],
      claims_supported: [ "ver", "iss", "aud", "jti", "iat", "exp", "sid", "sub", "roles" ],
    }

    return Promise.resolve(metadata)
  }
}
