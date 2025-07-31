import { UserRepository } from "~/domain/repositories"

export interface DeleteUserCommand {
  id: string
}

export class DeleteUserHandler {
  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: DeleteUserCommand): Promise<void> {
    const user = await this.userRepository.getById(command.id)
    await this.userRepository.delete(user)
  }
}
