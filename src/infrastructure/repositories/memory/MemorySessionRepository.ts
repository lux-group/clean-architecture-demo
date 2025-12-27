import { Session } from '~/domain/entities';
import { SessionRepository } from '~/domain/repositories';
import { MemoryRepository } from './MemoryRepository';

export class MemorySessionRepository extends MemoryRepository<Session> implements SessionRepository {
  constructor() {
    super('Session');
  }

  tryGetByIdentityProviderSessionId = (identityProviderSessionId: string) => this.tryGet({ identityProviderSessionId });
}
