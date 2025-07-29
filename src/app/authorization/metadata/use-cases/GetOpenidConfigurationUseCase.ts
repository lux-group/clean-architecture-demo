export class GetOpenidConfigurationUseCase {
  constructor(
    private readonly baseUrl: string,
  ) {}

  async execute(): Promise<object> {
    const metadata = {
      issuer: this.baseUrl + "/oauth2",
      jwks_uri: this.baseUrl + "/oauth2/.well-known/jwks",
      subject_types_supported: [ "public" ],
      id_token_signing_alg_values_supported: [ "RS256" ],
      response_types_supported: [],
      claims_supported: [ "ver", "iss", "aud", "jti", "iat", "exp", "sid", "sub", "roles" ],
    }

    return Promise.resolve(metadata)
  }
}
