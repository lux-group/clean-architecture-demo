import { User } from "~/domain/entities"
import { UserRepository } from "~/domain/repositories"
import { MemoryRepository } from "./MemoryRepository"

export class MemoryUserRepository extends MemoryRepository<User> implements UserRepository {
  constructor() {
    super("User")
  }

  tryGetByBrandAndEmail = (brand: string, email: string) => this.tryGet({ brand, email })

  tryGetByExternalIdentity = (identityProviderId: string, identifierClaimValue: string) => {
    return Promise.resolve(
      Object.values(this.store).find(u =>
        u.identities.some(
          i => i.identityProviderId === identityProviderId && i.identifierClaimValue === identifierClaimValue,
        ),
      ),
    )
  }
}
