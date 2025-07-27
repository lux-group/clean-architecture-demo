import { IdentityProviderRepository } from "./IdentityProviderRepository"
import { SessionRepository } from "./SessionRepository"
import { SigningKeyRepository } from "./SigningKeyRepository"
import { UserRepository } from "./UserRepository"

export interface TransactionalRepositories {
  userRepository: UserRepository
  sessionRepository: SessionRepository
  identityProviderRepository: IdentityProviderRepository
  signingKeyRepository: SigningKeyRepository
}

export interface UnitOfWork {
  execute<T>(operation: (repositories: TransactionalRepositories) => Promise<T>): Promise<T>
}
