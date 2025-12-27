import { EventPublisher } from '~/application/ports';
import { IdentityProvider, UpdateIdentityProviderProps } from '~/domain/entities';
import { EntityChangeEvent } from '~/domain/events';
import { IdentityProviderRepository } from '~/domain/repositories';

export type UpdateIdentityProviderCommand = UpdateIdentityProviderProps & {
  id: string;
};

export type UpdateIdentityProvider = ReturnType<typeof updateIdentityProvider>;

export const updateIdentityProvider = (
  identityProviderRepository: IdentityProviderRepository,
  eventPublisher: EventPublisher,
) => {
  return async (command: UpdateIdentityProviderCommand) => {
    const { id, ...props } = command;
    const identityProvider = await identityProviderRepository.getById(id);
    const updatedIdentityProvider = IdentityProvider.update(identityProvider, props);
    await identityProviderRepository.update(updatedIdentityProvider);

    const event = EntityChangeEvent.entityUpdated('Identity Provider', updatedIdentityProvider);
    eventPublisher.publishEvent(event);

    return updatedIdentityProvider;
  };
};
