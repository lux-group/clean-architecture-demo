import { User } from "~/domain/entities"
import { UserRepository } from "~/domain/repositories"

export interface GetUserByIdQuery {
  id: string
}

export class GetUserByIdHandler {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(query: GetUserByIdQuery): Promise<User> {
    return await this.userRepository.getById(query.id)
  }
}
