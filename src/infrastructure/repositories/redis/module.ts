import { asClass, asFunction, AwilixContainer, Resolver } from "awilix"
import { RedisSessionRepository } from "./RedisSessionRepository"
import { RedisSigningKeyRepository } from "./RedisSigningKeyRepository"
import { RedisIdentityProviderRepository } from "./RedisIdentityProviderRepository"
import { createClient } from "redis"

function decorate(container: AwilixContainer, name: string, resolver: Resolver<any>) {
  container.register({
    ["redisDecorated_" + name]: container.registrations[name],
    [name]: resolver
  })
}

export default function registerRedisDecoratorRepositories(container: AwilixContainer) {
  const logger = container.resolve("logger")
  const { redisUrl } = container.resolve("config")

  const client = createClient({ url: redisUrl })
  client.on('error', err => logger.error("Redis Client Error:", err))
  client.connect()

  container.register({
    redisClient: asFunction(() => client).singleton().disposer(c => c.quit()),
  })

  decorate(container, "sessionRepository", asClass(RedisSessionRepository).singleton())
  decorate(container, "signingKeyRepository", asClass(RedisSigningKeyRepository).singleton())
  decorate(container, "identityProviderRepository", asClass(RedisIdentityProviderRepository).singleton())
}
