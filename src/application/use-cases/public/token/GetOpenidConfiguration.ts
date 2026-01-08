import { ApiConfig, TokenIssuerConfig } from '~/application/ports';

export type GetOpenidConfiguration = ReturnType<typeof getOpenidConfiguration>;

export const getOpenidConfiguration = (apiConfig: ApiConfig, tokenIssuerConfig: TokenIssuerConfig) => {
  return async (): Promise<object> => {
    const issuer = apiConfig.host + apiConfig.basePath + tokenIssuerConfig.path;
    const metadata = {
      issuer,
      jwks_uri: `${apiConfig.host}${apiConfig.basePath}/.well-known/jwks`,
      token_endpoint: `${apiConfig.host}${apiConfig.basePath}/token`,
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256'],
      response_types_supported: [],
      claims_supported: ['ver', 'iss', 'aud', 'jti', 'iat', 'exp', 'sid', 'sub', 'roles'],
    };

    return Promise.resolve(metadata);
  };
};
