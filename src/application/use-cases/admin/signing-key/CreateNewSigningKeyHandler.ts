import { EventPublisher, KeyPairGenerator } from '~/application/ports';
import { SigningKey } from '~/domain/entities';
import { EntityChangeEvent } from '~/domain/events';
import { SigningKeyRepository } from '~/domain/repositories';

export class CreateNewSigningKeyHandler {
  constructor(
    private readonly keyPairGenerator: KeyPairGenerator,
    private readonly signingKeyRepository: SigningKeyRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(): Promise<SigningKey> {
    // Get the current active signing key. We need to do this before creating a new one.
    const currentSigningKey = await this.signingKeyRepository.tryGetActiveSigningKey();

    // Create a new signing key.
    const pair = await this.keyPairGenerator.generateKeyPair();

    const newSigningKey = SigningKey.createNew({
      publicKey: pair.publicKey,
      privateKey: pair.privateKey,
    });

    await this.signingKeyRepository.insert(newSigningKey);

    let event = EntityChangeEvent.entityCreated('Signing Key', newSigningKey);
    this.eventPublisher.publishEvent(event);

    // Deactivate the current signing key if it exists.
    if (currentSigningKey) {
      const deactivated = SigningKey.deactivate(currentSigningKey);
      await this.signingKeyRepository.update(deactivated);

      event = EntityChangeEvent.entityUpdated('Signing Key', deactivated);
      this.eventPublisher.publishEvent(event);
    }

    return newSigningKey;
  }
}
