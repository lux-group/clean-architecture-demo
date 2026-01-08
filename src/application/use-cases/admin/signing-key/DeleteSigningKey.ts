import { EventPublisher } from '~/application/ports';
import { SigningKey } from '~/domain/entities';
import { EntityChangeEvent } from '~/domain/events';
import { SigningKeyRepository } from '~/domain/repositories';

export interface DeleteSigningKeyCommand {
  id: string;
}

export type DeleteSigningKey = ReturnType<typeof deleteSigningKey>;

export const deleteSigningKey = (signingKeyRepository: SigningKeyRepository, eventPublisher: EventPublisher) => {
  return async (command: DeleteSigningKeyCommand): Promise<void> => {
    const signingKey = await signingKeyRepository.getById(command.id);
    SigningKey.ensureCanDelete(signingKey);
    await signingKeyRepository.delete(signingKey);

    const event = EntityChangeEvent.entityDeleted('Signing Key', command.id);
    eventPublisher.publishEvent(event);
  };
};
