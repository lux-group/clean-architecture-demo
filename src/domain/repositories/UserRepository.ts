import { User } from '../entities';
import { Repository } from './Repository';

export interface UserRepository extends Repository<User> {
  tryGetByBrandAndEmail(brand: string, email: string): Promise<User | undefined>;
  tryGetByExternalIdentity(identityProviderId: string, identifierClaimValue: string): Promise<User | undefined>;
}
