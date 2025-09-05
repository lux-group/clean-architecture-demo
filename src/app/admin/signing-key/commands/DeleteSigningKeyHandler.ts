import { EventPublisher } from "~/domain/adapters"
import { EntityChangeEvent } from "~/domain/events"
import { SigningKeyRepository } from "~/domain/repositories"

export interface DeleteSigningKeyCommand {
  id: string
}

export class DeleteSigningKeyHandler {
  constructor(
    private readonly signingKeyRepository: SigningKeyRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: DeleteSigningKeyCommand): Promise<void> {
    const signingKey = await this.signingKeyRepository.getById(command.id)
    signingKey.ensureCanDelete()
    await this.signingKeyRepository.delete(signingKey)

    const event = EntityChangeEvent.entityDeleted("Signing Key", command.id)
    this.eventPublisher.publishEvent(event)
  }
}
