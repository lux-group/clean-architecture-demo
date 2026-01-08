import { EventPublisher } from '~/application/ports';
import { EntityChangeEvent } from '~/domain/events';
import { IdentityProviderRepository } from '~/domain/repositories';

export interface DeleteIdentityProviderCommand {
  id: string;
}

export type DeleteIdentityProvider = ReturnType<typeof deleteIdentityProvider>;

export const deleteIdentityProvider = (
  identityProviderRepository: IdentityProviderRepository,
  eventPublisher: EventPublisher,
) => {
  return async (command: DeleteIdentityProviderCommand) => {
    const identityProvider = await identityProviderRepository.getById(command.id);
    await identityProviderRepository.delete(identityProvider);

    const event = EntityChangeEvent.entityDeleted('Identity Provider', command.id);
    eventPublisher.publishEvent(event);
  };
};
