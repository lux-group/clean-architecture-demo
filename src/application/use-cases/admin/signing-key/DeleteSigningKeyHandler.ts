import { EventPublisher } from '~/application/ports';
import { SigningKey } from '~/domain/entities';
import { EntityChangeEvent } from '~/domain/events';
import { SigningKeyRepository } from '~/domain/repositories';

export interface DeleteSigningKeyCommand {
  id: string;
}

export class DeleteSigningKeyHandler {
  constructor(
    private readonly signingKeyRepository: SigningKeyRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: DeleteSigningKeyCommand): Promise<void> {
    const signingKey = await this.signingKeyRepository.getById(command.id);
    SigningKey.ensureCanDelete(signingKey);
    await this.signingKeyRepository.delete(signingKey);

    const event = EntityChangeEvent.entityDeleted('Signing Key', command.id);
    this.eventPublisher.publishEvent(event);
  }
}
