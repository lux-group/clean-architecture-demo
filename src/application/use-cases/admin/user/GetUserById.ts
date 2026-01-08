import { User } from '~/domain/entities';
import { UserRepository } from '~/domain/repositories';

export interface GetUserByIdQuery {
  id: string;
}

export type GetUserById = ReturnType<typeof getUserById>;

export const getUserById = (userRepository: UserRepository) => {
  return async (query: GetUserByIdQuery): Promise<User> => {
    return await userRepository.getById(query.id);
  };
};
