import { AwilixContainer, asClass, asFunction, Resolver } from 'awilix';
import { createClient } from 'redis';
import { Config } from '~/infrastructure/config/schema';
import { RedisIdentityProviderRepository } from './RedisIdentityProviderRepository';
import { RedisSessionRepository } from './RedisSessionRepository';
import { RedisSigningKeyRepository } from './RedisSigningKeyRepository';

function decorate<T>(container: AwilixContainer, name: string, resolver: Resolver<T>) {
  container.register({
    [`redisDecorated_${name}`]: container.registrations[name],
    [name]: resolver,
  });
}

export default async function registerRedisDecoratorRepositories(container: AwilixContainer) {
  const logger = container.resolve('logger');
  const { redis } = container.resolve<Config>('config');

  const client = createClient({ url: redis.url });
  client.on('error', err => logger.error('Redis Client Error:', err));
  await client.connect();

  container.register({
    redisClient: asFunction(() => client)
      .singleton()
      .disposer(c => c.quit()),
  });

  decorate(container, 'sessionRepository', asClass(RedisSessionRepository).singleton());
  decorate(container, 'signingKeyRepository', asClass(RedisSigningKeyRepository).singleton());
  decorate(container, 'identityProviderRepository', asClass(RedisIdentityProviderRepository).singleton());
}
