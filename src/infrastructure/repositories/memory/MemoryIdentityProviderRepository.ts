import { IdentityProvider } from "~/domain/entities"
import { IdentityProviderRepository } from "~/domain/repositories"
import { MemoryRepository } from "./MemoryRepository"

export class MemoryIdentityProviderRepository extends MemoryRepository<IdentityProvider> implements IdentityProviderRepository {
  constructor() {
    super("Identity provider")
  }

  getByName = (name: string) => this.get({ name })
  tryGetByIssuerUrlAndAudience = (issuerUrl: string, audience: string) => this.tryGet({ issuerUrl, audience })
}
