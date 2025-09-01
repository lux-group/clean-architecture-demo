import { RedisClientType } from "redis"
import { ObjectTransformer, toDateObject, toISODateString } from "~/lib/ObjectTransformer"
import { SigningKey } from "~/domain/entities"
import { SigningKeyRepository } from "~/domain/repositories"
import { RedisRepository } from "./RedisRepository"

export class RedisSigningKeyRepository extends RedisRepository<SigningKey, SigningKeyRepository> implements SigningKeyRepository {
  constructor(
    redisClient: RedisClientType,
    redisDecorated_signingKeyRepository: SigningKeyRepository
  ) {
    super("signing_key", 3600, redisClient, redisDecorated_signingKeyRepository)
  }

  async tryGetActiveSigningKey(): Promise<SigningKey | undefined> {
    const activeCacheKey = this.getCacheKey("active")
    const cached = await this.redisClient.get(activeCacheKey)
    if (cached) {
      return this.deserializeEntity(cached)
    }

    const signingKey = await this.repository.tryGetActiveSigningKey()
    if (signingKey) {
      this.redisClient.setEx(activeCacheKey, this.cacheDurationSeconds, this.serializeEntity(signingKey))
    }
    
    return signingKey
  }

  protected override serializeEntity(signingKey: SigningKey): string {
    // TODO: Encrypt sensitive data (private key) before storing in Redis
    const props = ObjectTransformer.transform(signingKey.props, [], [toISODateString])
    return JSON.stringify(props)
  }

  protected override deserializeEntity(data: string): SigningKey {
    const props = ObjectTransformer.transform(JSON.parse(data), [], [toDateObject])
    return new SigningKey(props)
  }

  protected override async removeFromCache(signingKey: SigningKey): Promise<void> {
    const idCacheKey = this.getCacheKey("id", signingKey.id)
    const activeCacheKey = this.getCacheKey("active")

    await Promise.all([
      this.redisClient.del(idCacheKey),
      this.redisClient.del(activeCacheKey),
    ])
  }
}
