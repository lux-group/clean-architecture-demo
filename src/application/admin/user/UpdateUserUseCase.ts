import { User, UpdateUserProps } from "~/domain/entities"
import { UserRepository } from "~/domain/repositories"

export type UpdateUserInput = UpdateUserProps & {
  id: string
}

export class UpdateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: UpdateUserInput): Promise<User> {
    const { id, ...props } = input
    const user = await this.userRepository.getById(id)
    user.update(props)
    await this.userRepository.update(user)
    return user
  }
}
