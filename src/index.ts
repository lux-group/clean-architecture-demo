import { Server } from 'node:http';
import { AwilixContainer } from 'awilix';
import { Application } from 'express';
import { createContainer } from './createContainer';

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
  const container = await createContainer(environment);
  const app = container.resolve<Application>('app');
  const server = app.listen(port, () => console.log(`Listening on port ${port}`));
  server.keepAliveTimeout = 6 * 60 * 1000;

  process.on('SIGINT', () => shutdown(server, container));
  process.on('SIGTERM', () => shutdown(server, container));
}

start().catch(console.error);
