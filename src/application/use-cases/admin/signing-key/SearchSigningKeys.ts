import { SigningKey } from '~/domain/entities';
import { SigningKeyRepository } from '~/domain/repositories';
import { Query, QueryResult } from '~/lib/types';

export type SearchSigningKeysQuery = Query<SigningKey>;

export type SearchSigningKeysResult = QueryResult<SigningKey>;

export type SearchSigningKeys = ReturnType<typeof searchSigningKeys>;

export const searchSigningKeys = (signingKeyRepository: SigningKeyRepository) => {
  return async (query: SearchSigningKeysQuery): Promise<SearchSigningKeysResult> => {
    return await signingKeyRepository.query(query);
  };
};
