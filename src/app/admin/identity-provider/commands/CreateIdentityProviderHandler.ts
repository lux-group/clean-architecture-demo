import { CreateIdentityProviderProps, IdentityProvider } from "~/domain/entities"
import { IdentityProviderRepository } from "~/domain/repositories"
import { EventPublisher } from "~/domain/adapters"
import { EntityChangeEvent } from "~/domain/events"

export type CreateIdentityProviderCommand = CreateIdentityProviderProps

export class CreateIdentityProviderHandler {
  constructor(
    private readonly identityProviderRepository: IdentityProviderRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: CreateIdentityProviderCommand): Promise<IdentityProvider> {
    const identityProvider = IdentityProvider.createNew(command)
    await this.identityProviderRepository.insert(identityProvider)
    
    const event = EntityChangeEvent.entityCreated("Identity Provider", identityProvider)
    this.eventPublisher.publishEvent(event)
    
    return identityProvider
  }
}
