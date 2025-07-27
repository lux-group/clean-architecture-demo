import { IdentityProvider } from "../entities"

export interface IdentityProviderRepository {
  query(): Promise<IdentityProvider[]>
  getById(id: string): Promise<IdentityProvider>
  tryGetById(id: string): Promise<IdentityProvider | undefined>
  getByName(name: string): Promise<IdentityProvider>
  tryGetByIssuerUrlAndAudience(issuerUrl: string, audience: string): Promise<IdentityProvider | undefined>
  insert(identityProvider: IdentityProvider): Promise<void>
  update(identityProvider: IdentityProvider): Promise<void>
  delete(id: string): Promise<void>
}
