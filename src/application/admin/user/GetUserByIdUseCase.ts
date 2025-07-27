import { User } from "~/domain/entities"
import { UserRepository } from "~/domain/repositories"

export interface GetUserByIdInput {
  id: string
}

export class GetUserByIdUseCase {
  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: GetUserByIdInput): Promise<User> {
    return await this.userRepository.getById(input.id)
  }
}
