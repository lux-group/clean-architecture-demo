import { IdentityProvider } from '../entities';
import { Repository } from './Repository';

export interface IdentityProviderRepository extends Repository<IdentityProvider> {
  tryGetByName(name: string): Promise<IdentityProvider | undefined>;
  tryGetByIssuerUrlAndAudience(issuerUrl: string, audience: string): Promise<IdentityProvider | undefined>;
}
