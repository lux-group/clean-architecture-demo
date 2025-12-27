import { Server } from 'node:http';
import { AwilixContainer, asValue, createContainer, InjectionMode } from 'awilix';
import { Application } from 'express';
import registerApi from '~/api/module';
import registerApplicationServices from '~/application/module';
import createTestData from '~/data';
import registerDomainServices from '~/domain/module';
import registerConfig from '~/infrastructure/config/module';
import registerInfrastructureServices from '~/infrastructure/module';
import registerMemoryRepositories from '~/infrastructure/repositories/memory/module';
import registerPrismaRepositories from '~/infrastructure/repositories/prisma/module';
import registerRedisDecoratorRepositories from '~/infrastructure/repositories/redis/module';

const environment = process.env.NODE_ENV || 'dev';
const port = process.env.PORT || 3000;

let isShuttingDown = false;

async function shutdown(server: Server, container: AwilixContainer): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  try {
    // Stop the Express server.
    await new Promise<void>(resolve => server.close(() => resolve()));

    // Dispose the container. This will close all connections to the databases.
    await container.dispose();

    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

async function start(): Promise<void> {
  const container = createContainer({
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

  const app = container.resolve<Application>('app');
  const server = app.listen(port, () => console.log(`Listening on port ${port}`));
  server.keepAliveTimeout = 6 * 60 * 1000;

  process.on('SIGINT', () => shutdown(server, container));
  process.on('SIGTERM', () => shutdown(server, container));
}

start().catch(console.error);
