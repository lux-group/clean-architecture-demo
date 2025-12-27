import { SigningKey } from '~/domain/entities';
import { SigningKeyRepository } from '~/domain/repositories';
import { MemoryRepository } from './MemoryRepository';

export class MemorySigningKeyRepository extends MemoryRepository<SigningKey> implements SigningKeyRepository {
  constructor() {
    super('Signing key');
  }

  tryGetActiveSigningKey = () => Promise.resolve(Object.values(this.store).find(s => !!s.privateKey));
}
