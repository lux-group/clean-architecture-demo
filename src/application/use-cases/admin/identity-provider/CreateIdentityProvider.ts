import { EventPublisher } from '~/application/ports';
import { CreateIdentityProviderProps, IdentityProvider } from '~/domain/entities';
import { EntityChangeEvent } from '~/domain/events';
import { IdentityProviderRepository } from '~/domain/repositories';

export type CreateIdentityProviderCommand = CreateIdentityProviderProps;

export type CreateIdentityProvider = ReturnType<typeof createIdentityProvider>;

export const createIdentityProvider = (
  identityProviderRepository: IdentityProviderRepository,
  eventPublisher: EventPublisher,
) => {
  return async (command: CreateIdentityProviderCommand) => {
    const identityProvider = IdentityProvider.createNew(command);
    await identityProviderRepository.insert(identityProvider);

    const event = EntityChangeEvent.entityCreated('Identity Provider', identityProvider);
    eventPublisher.publishEvent(event);

    return identityProvider;
  };
};
