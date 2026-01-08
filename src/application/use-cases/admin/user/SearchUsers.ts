import { User } from '~/domain/entities';
import { UserRepository } from '~/domain/repositories';
import { Query, QueryResult } from '~/lib/types';

export type SearchUsersQuery = Query<User>;

export type SearchUsersResult = QueryResult<User>;

export type SearchUsers = ReturnType<typeof searchUsers>;

export const searchUsers = (userRepository: UserRepository) => {
  return async (query: SearchUsersQuery): Promise<SearchUsersResult> => {
    return await userRepository.query(query);
  };
};
