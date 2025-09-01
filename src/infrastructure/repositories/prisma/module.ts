import { asClass, asFunction, AwilixContainer } from "awilix"
import { createPrismaClient } from "./PrismaClient"
import { PrismaUnitOfWork } from "./PrismaUnitOfWork"
import { PrismaIdentityProviderRepository } from "./PrismaIdentityProviderRepository"
import { PrismaUserRepository } from "./PrismaUserRepository"
import { PrismaSessionRepository } from "./PrismaSessionRepository"
import { PrismaSigningKeyRepository } from "./PrismaSigningKeyRepository"

export default async function registerPrismaRepositories(container: AwilixContainer) {
  const { logger, postgresReadOnlyUrl, postgresReadWriteUrl } = container.resolve("config")
  const prismaClient = createPrismaClient(logger, postgresReadOnlyUrl, postgresReadWriteUrl)
  await prismaClient.$connect()

  container.register({
    prismaClient: asFunction(() => prismaClient).singleton().disposer(c => c.$disconnect()),
    unitOfWork: asClass(PrismaUnitOfWork).transient(),
    
    identityProviderRepository: asClass(PrismaIdentityProviderRepository).singleton(),
    sessionRepository: asClass(PrismaSessionRepository).singleton(),
    signingKeyRepository: asClass(PrismaSigningKeyRepository).singleton(),
    userRepository: asClass(PrismaUserRepository).singleton(),
  })
}
