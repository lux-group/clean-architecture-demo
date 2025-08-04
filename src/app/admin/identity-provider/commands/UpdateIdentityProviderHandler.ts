import { IdentityProvider, UpdateIdentityProviderProps } from "~/domain/entities"
import { IdentityProviderRepository } from "~/domain/repositories"
import { EventPublisher } from "~/domain/adapters"
import { EntityChangeEvent } from "~/domain/events"

export type UpdateIdentityProviderCommand = UpdateIdentityProviderProps & {
  id: string
}

export class UpdateIdentityProviderHandler {
  constructor(
    private readonly identityProviderRepository: IdentityProviderRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: UpdateIdentityProviderCommand): Promise<IdentityProvider> {
    const { id, ...props } = command
    const identityProvider = await this.identityProviderRepository.getById(id)
    identityProvider.update(props)
    await this.identityProviderRepository.update(identityProvider)
    
    const event = EntityChangeEvent.entityUpdated("Identity Provider", identityProvider)
    this.eventPublisher.publishEvent(event)
    
    return identityProvider
  }
}
