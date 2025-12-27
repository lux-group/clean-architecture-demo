import { IdentityProviderRepository } from '~/domain/repositories';

export interface GetIdentityProviderByIdQuery {
  id: string;
}

export type GetIdentityProviderById = ReturnType<typeof getIdentityProviderById>;

export const getIdentityProviderById = (identityProviderRepository: IdentityProviderRepository) => {
  return async (query: GetIdentityProviderByIdQuery) => {
    return await identityProviderRepository.getById(query.id);
  };
};
