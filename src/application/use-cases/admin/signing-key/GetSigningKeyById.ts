import { SigningKey } from '~/domain/entities';
import { SigningKeyRepository } from '~/domain/repositories';

export interface GetSigningKeyByIdQuery {
  id: string;
}

export type GetSigningKeyById = ReturnType<typeof getSigningKeyById>;

export const getSigningKeyById = (signingKeyRepository: SigningKeyRepository) => {
  return async (query: GetSigningKeyByIdQuery): Promise<SigningKey> => {
    return await signingKeyRepository.getById(query.id);
  };
};
