import { User, CreateUserProps } from "~/domain/entities"
import { UserRepository } from "~/domain/repositories"
import { PasswordVerifier } from "~/domain/adapters"

export type CreateUserCommand = Omit<CreateUserProps, "emailVerified" | "passwordHash"> & {
  password: string
}

export class CreateUserHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordVerifier: PasswordVerifier,
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    const { password, ...inputWithoutPassword } = command

    const props: CreateUserProps = {
      ...inputWithoutPassword,
      emailVerified: false,
      passwordHash: this.passwordVerifier.createPasswordHash(command.password)
    }

    const user = User.createNew(props)
    await this.userRepository.insert(user)
    return user
  }
}
