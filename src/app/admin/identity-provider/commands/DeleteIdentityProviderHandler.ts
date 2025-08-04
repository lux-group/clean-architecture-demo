import { IdentityProviderRepository } from "~/domain/repositories"
import { EventPublisher } from "~/domain/adapters"
import { EntityChangeEvent } from "~/domain/events"

export interface DeleteIdentityProviderCommand {
  id: string
}

export class DeleteIdentityProviderHandler {
  constructor(
    private readonly identityProviderRepository: IdentityProviderRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: DeleteIdentityProviderCommand): Promise<void> {
    const identityProvider = await this.identityProviderRepository.getById(command.id)
    await this.identityProviderRepository.delete(identityProvider)
    
    const event = EntityChangeEvent.entityDeleted("Identity Provider", command.id)
    this.eventPublisher.publishEvent(event)
  }
}
