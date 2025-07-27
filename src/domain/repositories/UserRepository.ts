import { User } from "../entities"

export interface UserRepository {
  query(): Promise<User[]>
  getById(id: string): Promise<User>
  tryGetById(id: string): Promise<User | undefined>
  tryGetByBrandAndEmail(brand: string, email: string): Promise<User | undefined>
  tryGetByExternalIdentity(identityProviderId: string, identifierClaimValue: string): Promise<User | undefined>
  insert(user: User): Promise<void>
  update(user: User): Promise<void>
  delete(id: string): Promise<void>
}
