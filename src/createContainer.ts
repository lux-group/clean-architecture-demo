import { AwilixContainer, asValue, createContainer as createAwilixContainer, InjectionMode } from 'awilix';
import registerApi from '~/api/module';
import registerApplicationServices from '~/application/module';
import createTestData from '~/createTestData';
import registerDomainServices from '~/domain/module';
import registerConfig from '~/infrastructure/config/module';
import registerInfrastructureServices from '~/infrastructure/module';
import registerMemoryRepositories from '~/infrastructure/repositories/memory/module';
import registerPrismaRepositories from '~/infrastructure/repositories/prisma/module';
import registerRedisDecoratorRepositories from '~/infrastructure/repositories/redis/module';

export const createContainer = async (environment: string): Promise<AwilixContainer> => {
  const container = createAwilixContainer({
    injectionMode: InjectionMode.CLASSIC,
    strict: true,
  });

  container.register({
    container: asValue(container),
  });

  await registerApi(container);
  await registerConfig(container, environment);
  await registerApplicationServices(container);
  await registerDomainServices(container);
  await registerInfrastructureServices(container);

  if (environment === 'dev') {
    await registerMemoryRepositories(container);
    await createTestData(container);
  } else {
    await registerPrismaRepositories(container);
    await registerRedisDecoratorRepositories(container);
  }

  return container;
};