import { EventPublisher, KeyPairGenerator } from '~/application/ports';
import { SigningKey } from '~/domain/entities';
import { EntityChangeEvent } from '~/domain/events';
import { SigningKeyRepository } from '~/domain/repositories';

export type CreateNewSigningKey = ReturnType<typeof createNewSigningKey>;

export const createNewSigningKey = (
  keyPairGenerator: KeyPairGenerator,
  signingKeyRepository: SigningKeyRepository,
  eventPublisher: EventPublisher,
) => {
  return async (): Promise<SigningKey> => {
    // Get the current active signing key. We need to do this before creating a new one.
    const currentSigningKey = await signingKeyRepository.tryGetActiveSigningKey();

    // Create a new signing key.
    const pair = await keyPairGenerator.generateKeyPair();

    const newSigningKey = SigningKey.createNew({
      publicKey: pair.publicKey,
      privateKey: pair.privateKey,
    });

    await signingKeyRepository.insert(newSigningKey);

    let event = EntityChangeEvent.entityCreated('Signing Key', newSigningKey);
    eventPublisher.publishEvent(event);

    // Deactivate the current signing key if it exists.
    if (currentSigningKey) {
      const deactivated = SigningKey.deactivate(currentSigningKey);
      await signingKeyRepository.update(deactivated);

      event = EntityChangeEvent.entityUpdated('Signing Key', deactivated);
      eventPublisher.publishEvent(event);
    }

    return newSigningKey;
  };
};
