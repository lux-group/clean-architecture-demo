import { EventPublisher } from "~/app/ports"
import { UpdateUserProps, User } from "~/domain/entities"
import { EntityChangeEvent } from "~/domain/events"
import { UserRepository } from "~/domain/repositories"

export type UpdateUserCommand = UpdateUserProps & {
  id: string
}

export class UpdateUserHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: UpdateUserCommand): Promise<User> {
    const { id, ...props } = command
    const user = await this.userRepository.getById(id)
    user.update(props)
    await this.userRepository.update(user)

    const event = EntityChangeEvent.entityUpdated("User", user)
    this.eventPublisher.publishEvent(event)

    return user
  }
}
