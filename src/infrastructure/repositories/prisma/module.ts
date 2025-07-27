import { asClass, asValue, AwilixContainer } from "awilix"
import { createPrismaClient } from "./PrismaClient"
import { PrismaUnitOfWork } from "./PrismaUnitOfWork"
import { PrismaIdentityProviderRepository } from "./PrismaIdentityProviderRepository"
import { PrismaUserRepository } from "./PrismaUserRepository"
import { PrismaSessionRepository } from "./PrismaSessionRepository"
import { PrismaSigningKeyRepository } from "./PrismaSigningKeyRepository"

export default function registerPrismaRepositories(container: AwilixContainer) {
  const { postgresReadOnlyUrl, postgresReadWriteUrl } = container.resolve("config")
  const prismaClient = createPrismaClient(postgresReadOnlyUrl, postgresReadWriteUrl)

  container.register({
    prismaClient: asValue(prismaClient),
    unitOfWork: asClass(PrismaUnitOfWork).singleton(),
    identityProviderRepository: asClass(PrismaIdentityProviderRepository).singleton(),
    sessionRepository: asClass(PrismaSessionRepository).singleton(),
    signingKeyRepository: asClass(PrismaSigningKeyRepository).singleton(),
    userRepository: asClass(PrismaUserRepository).singleton(),
  })
}
