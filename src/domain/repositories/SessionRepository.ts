import { Session } from '../entities';
import { Repository } from './Repository';

export interface SessionRepository extends Repository<Session> {
  tryGetById(id: string): Promise<Session | undefined>;
  tryGetByIdentityProviderSessionId(identityProviderSessionId: string): Promise<Session | undefined>;
}
