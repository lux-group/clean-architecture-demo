import { EventPublisher } from "~/domain/adapters"
import { EntityChangeEvent } from "~/domain/events"
import { UserRepository } from "~/domain/repositories"

export interface DeleteUserCommand {
  id: string
}

export class DeleteUserHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: DeleteUserCommand): Promise<void> {
    const user = await this.userRepository.getById(command.id)
    await this.userRepository.delete(user)

    const event = EntityChangeEvent.entityDeleted("User", command.id)
    this.eventPublisher.publishEvent(event)
  }
}
