import { EventPublisher, PasswordVerifier } from "~/app/shared/adapters"
import { CreateUserProps, User } from "~/domain/entities"
import { EntityChangeEvent } from "~/domain/events"
import { UserRepository } from "~/domain/repositories"

export type CreateUserCommand = Omit<CreateUserProps, "emailVerified" | "passwordHash"> & {
  password: string
}

export class CreateUserHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordVerifier: PasswordVerifier,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    const { password: _, ...inputWithoutPassword } = command

    const props: CreateUserProps = {
      ...inputWithoutPassword,
      emailVerified: false,
      passwordHash: this.passwordVerifier.createPasswordHash(command.password),
    }

    const user = User.createNew(props)
    await this.userRepository.insert(user)

    const event = EntityChangeEvent.entityCreated("User", user)
    this.eventPublisher.publishEvent(event)

    return user
  }
}
