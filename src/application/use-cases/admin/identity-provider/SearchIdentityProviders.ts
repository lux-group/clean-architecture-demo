import { IdentityProvider } from '~/domain/entities';
import { IdentityProviderRepository } from '~/domain/repositories';
import { Query, QueryResult } from '~/lib/types';

export type SearchIdentityProvidersQuery = Query<IdentityProvider>;

export type SearchIdentityProvidersResult = QueryResult<IdentityProvider>;

export type SearchIdentityProviders = ReturnType<typeof searchIdentityProviders>;

export const searchIdentityProviders = (identityProviderRepository: IdentityProviderRepository) => {
  return async (query: SearchIdentityProvidersQuery) => {
    return await identityProviderRepository.query(query);
  };
};
