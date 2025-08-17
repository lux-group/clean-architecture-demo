import { EncryptionProvider } from "~/infrastructure/crypto"
import { TransactionalRepositories, UnitOfWork } from "~/domain/repositories/UnitOfWork"
import { PrismaIdentityProviderRepository } from "./PrismaIdentityProviderRepository"
import { PrismaSessionRepository } from "./PrismaSessionRepository"
import { PrismaSigningKeyRepository } from "./PrismaSigningKeyRepository"
import { PrismaUserRepository } from "./PrismaUserRepository"
import { PrismaClient } from "./PrismaClient"

export class PrismaUnitOfWork implements UnitOfWork {
  constructor(
    private prismaClient: PrismaClient,
    private encryptionProvider: EncryptionProvider
  ) {}

  async execute<T>(operation: (repositories: TransactionalRepositories) => Promise<T>): Promise<T> {
    return await this.prismaClient.$primary().$transaction(async (transaction: unknown) => {
      const repositories: TransactionalRepositories = {
        identityProviderRepository: new PrismaIdentityProviderRepository(transaction as PrismaClient, this.encryptionProvider),
        sessionRepository: new PrismaSessionRepository(transaction as PrismaClient, this.encryptionProvider),
        signingKeyRepository: new PrismaSigningKeyRepository(transaction as PrismaClient, this.encryptionProvider),
        userRepository: new PrismaUserRepository(transaction as PrismaClient),
      }

      return await operation(repositories)
    })
  }
}
