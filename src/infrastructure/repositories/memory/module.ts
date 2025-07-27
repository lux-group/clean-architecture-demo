import { asClass, AwilixContainer } from "awilix"
import { MemoryIdentityProviderRepository } from "./MemoryIdentityProviderRepository"
import { MemorySessionRepository } from "./MemorySessionRepository"
import { MemorySigningKeyRepository } from "./MemorySigningKeyRepository"
import { MemoryUserRepository } from "./MemoryUserRepository"

export default function registerMemoryRepositories(container: AwilixContainer) {
  container.register({
    identityProviderRepository: asClass(MemoryIdentityProviderRepository).singleton(),
    sessionRepository: asClass(MemorySessionRepository).singleton(),
    signingKeyRepository: asClass(MemorySigningKeyRepository).singleton(),
    userRepository: asClass(MemoryUserRepository).singleton(),
  })
}
