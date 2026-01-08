import { AwilixContainer, asValue, createContainer, InjectionMode } from 'awilix';
import { Application } from 'express';
import registerApi from '~/api/module';
import registerApplicationServices from '~/application/module';
import { TokenIssuer, TokenRequest, TokenVersion } from '~/application/ports';
import registerDomainServices from '~/domain/module';
import registerConfig from '~/infrastructure/config/module';
import registerInfrastructureServices from '~/infrastructure/module';
import registerPrismaRepositories from '~/infrastructure/repositories/prisma/module';
import registerRedisDecoratorRepositories from '~/infrastructure/repositories/redis/module';
import { TestDataContext } from './TestDataContext';

export interface TestContext {
  container: AwilixContainer;
  server: Application;
  data: TestDataContext;
  createAccessToken: (userId: string, scopes: string[]) => Promise<string>;
}

const createTestContainer = async () => {
  const container = createContainer({
    injectionMode: InjectionMode.CLASSIC,
    strict: true,
  });

  container.register({
    container: asValue(container),
  });

  await registerApi(container);
  await registerConfig(container, 'test');
  await registerApplicationServices(container);
  await registerDomainServices(container);
  await registerInfrastructureServices(container);
  await registerPrismaRepositories(container);
  await registerRedisDecoratorRepositories(container);
  return container;
};

export const getTestContext = async (): Promise<TestContext> => {
  const container = await createTestContainer();
  const server = container.resolve<Application>('app');
  const data = new TestDataContext(container);

  // Ensure we have a signing key.
  await data.getActiveSigningKey();

  const createAccessToken = async (userId: string, scopes: string[]) => {
    const tokenIssuer = container.resolve<TokenIssuer>('tokenIssuer');
    const request: TokenRequest = { version: TokenVersion.V2, userId, scopes, customClaims: {} };
    return (await tokenIssuer.createAccessToken(request)).accessToken;
  };

  return { container, server, data, createAccessToken };
};
