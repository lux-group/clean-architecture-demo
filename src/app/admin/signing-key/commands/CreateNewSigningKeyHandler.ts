import { EventPublisher } from "~/domain/adapters"
import { SigningKey } from "~/domain/entities"
import { EntityChangeEvent } from "~/domain/events"
import { SigningKeyRepository } from "~/domain/repositories"
import { KeyPairGenerator } from "~/infrastructure/crypto"

export class CreateNewSigningKeyHandler {
  constructor(
    private readonly keyPairGenerator: KeyPairGenerator,
    private readonly signingKeyRepository: SigningKeyRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(): Promise<SigningKey> {
    // Get the current active signing key. We need to do this before creating a new one.
    const currentSigningKey = await this.signingKeyRepository.tryGetActiveSigningKey()

    // Create a new signing key.
    const pair = await this.keyPairGenerator.generateKeyPair()

    const newSigningKey = SigningKey.createNew({
      publicKey: pair.publicKey,
      privateKey: pair.privateKey,
    })

    await this.signingKeyRepository.insert(newSigningKey)

    let event = EntityChangeEvent.entityCreated("Signing Key", newSigningKey)
    this.eventPublisher.publishEvent(event)

    // Deactivate the current signing key if it exists.
    if (currentSigningKey) {
      currentSigningKey.deactivate()
      await this.signingKeyRepository.update(currentSigningKey)

      event = EntityChangeEvent.entityUpdated("Signing Key", currentSigningKey)
      this.eventPublisher.publishEvent(event)
    }

    return newSigningKey
  }
}
