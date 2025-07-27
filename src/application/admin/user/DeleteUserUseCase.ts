import { UserRepository } from "~/domain/repositories"

export interface DeleteUserInput {
  id: string
}

export class DeleteUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: DeleteUserInput): Promise<void> {
    const user = await this.userRepository.getById(input.id)
    await this.userRepository.delete(user.id)
  }
}
