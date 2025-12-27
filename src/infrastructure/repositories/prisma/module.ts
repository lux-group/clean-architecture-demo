import { AwilixContainer, asClass, asFunction } from 'awilix';
import { Config } from '~/infrastructure/config/schema';
import { createPrismaClient } from './PrismaClient';
import { PrismaIdentityProviderRepository } from './PrismaIdentityProviderRepository';
import { PrismaSessionRepository } from './PrismaSessionRepository';
import { PrismaSigningKeyRepository } from './PrismaSigningKeyRepository';
import { PrismaUserRepository } from './PrismaUserRepository';

export default async function registerPrismaRepositories(container: AwilixContainer) {
  const { postgres } = container.resolve<Config>('config');
  const logger = container.resolve('logger');

  const prismaClient = createPrismaClient(logger, postgres.readOnlyUrl!, [postgres.readWriteUrl!]);
  await prismaClient.$connect();

  container.register({
    prismaClient: asFunction(() => prismaClient)
      .singleton()
      .disposer(c => c.$disconnect()),

    identityProviderRepository: asClass(PrismaIdentityProviderRepository).singleton(),
    sessionRepository: asClass(PrismaSessionRepository).singleton(),
    signingKeyRepository: asClass(PrismaSigningKeyRepository).singleton(),
    userRepository: asClass(PrismaUserRepository).singleton(),
  });
}
