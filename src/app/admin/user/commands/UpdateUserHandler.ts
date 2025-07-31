import { User, UpdateUserProps } from "~/domain/entities"
import { UserRepository } from "~/domain/repositories"

export type UpdateUserCommand = UpdateUserProps & {
  id: string
}

export class UpdateUserHandler {
  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: UpdateUserCommand): Promise<User> {
    const { id, ...props } = command
    const user = await this.userRepository.getById(id)
    user.update(props)
    await this.userRepository.update(user)
    return user
  }
}
