import { User, CreateUserProps } from "~/domain/entities"
import { UserRepository } from "~/domain/repositories"
import { PasswordVerifier } from "~/domain/adapters"

export type CreateUserInput = Omit<CreateUserProps, "emailVerified" | "passwordHash"> & {
  password: string
}

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordVerifier: PasswordVerifier,
  ) {}

  async execute(input: CreateUserInput): Promise<User> {
    const { password, ...inputWithoutPassword } = input

    const props: CreateUserProps = {
      ...inputWithoutPassword,
      emailVerified: false,
      passwordHash: this.passwordVerifier.createPasswordHash(input.password)
    }

    const user = User.createNew(props)
    await this.userRepository.insert(user)
    return user
  }
}
