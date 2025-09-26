import { AwilixContainer, asClass, asFunction } from "awilix"
import { createPrismaClient } from "./PrismaClient"
import { PrismaIdentityProviderRepository } from "./PrismaIdentityProviderRepository"
import { PrismaSessionRepository } from "./PrismaSessionRepository"
import { PrismaSigningKeyRepository } from "./PrismaSigningKeyRepository"
import { PrismaUserRepository } from "./PrismaUserRepository"

export default async function registerPrismaRepositories(container: AwilixContainer) {
  const { postgresReadOnlyUrl, postgresReadWriteUrl } = container.resolve("config")
  const logger = container.resolve("logger")

  const prismaClient = createPrismaClient(logger, postgresReadOnlyUrl, postgresReadWriteUrl)
  await prismaClient.$connect()

  container.register({
    prismaClient: asFunction(() => prismaClient)
      .singleton()
      .disposer(c => c.$disconnect()),

    identityProviderRepository: asClass(PrismaIdentityProviderRepository).singleton(),
    sessionRepository: asClass(PrismaSessionRepository).singleton(),
    signingKeyRepository: asClass(PrismaSigningKeyRepository).singleton(),
    userRepository: asClass(PrismaUserRepository).singleton(),
  })
}
