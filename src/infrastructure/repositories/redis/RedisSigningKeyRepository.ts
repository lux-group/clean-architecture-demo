import { RedisClientType } from "redis"
import { SigningKey, SigningKeyProps } from "~/domain/entities"
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
    const props = signingKey.props as SigningKeyProps
    return JSON.stringify({
      ...props,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    })
  }

  protected override deserializeEntity(data: string): SigningKey {
    const props = JSON.parse(data)
    return new SigningKey({
      ...props,
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt),
    })
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
