import { User } from '~/domain/entities';
import { UserRepository } from '~/domain/repositories';

export interface GetProfileByIdQuery {
  id: string;
}

export type GetProfileById = ReturnType<typeof getProfileById>;

export const getProfileById = (userRepository: UserRepository) => {
  return async (query: GetProfileByIdQuery): Promise<User> => {
    return await userRepository.getById(query.id);
  };
};
