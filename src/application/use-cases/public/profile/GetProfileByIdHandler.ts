import { User } from '~/domain/entities';
import { UserRepository } from '~/domain/repositories';

export interface GetProfileByIdQuery {
  id: string;
}

export class GetProfileByIdHandler {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(query: GetProfileByIdQuery): Promise<User> {
    return await this.userRepository.getById(query.id);
  }
}
