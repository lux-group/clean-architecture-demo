import { RedisClientType } from "redis"
import { Entity, EntityProps } from "~/domain/entities"
import { Repository } from "~/domain/repositories"

export abstract class RedisRepository<T extends Entity<EntityProps>, R extends Repository<T>> implements Repository<T> {
  constructor(
    protected readonly cachePrefix: string,
    protected readonly cacheDurationSeconds: number,
    protected readonly redisClient: RedisClientType,
    protected readonly repository: R,
  ) {}

  async query(offset?: number, limit?: number): Promise<T[]> {
    return await this.repository.query(offset, limit)
  }

  async getById(id: string): Promise<T> {
    const idCacheKey = this.getCacheKey("id", id)
    const cached = await this.redisClient.get(idCacheKey)
    if (cached) {
      return this.deserializeEntity(cached)
    }

    const entity = await this.repository.getById(id)
    await this.addToCache(entity)

    return entity
  }

  async tryGetById(id: string): Promise<T | undefined> {
    const idCacheKey = this.getCacheKey("id", id)
    const cached = await this.redisClient.get(idCacheKey)
    if (cached) {
      return this.deserializeEntity(cached)
    }

    const entity = await this.repository.tryGetById(id)
    if (entity) {
      await this.addToCache(entity)
    }

    return entity
  }

  async insert(entity: T): Promise<void> {
    await this.repository.insert(entity)
    await this.addToCache(entity)
  }

  async update(entity: T): Promise<void> {
    await this.repository.update(entity)
    await this.removeFromCache(entity)
    await this.addToCache(entity)
  }

  async delete(entity: T): Promise<void> {
    await this.repository.delete(entity)
    await this.removeFromCache(entity)
  }

  protected abstract serializeEntity(entity: T): string

  protected abstract deserializeEntity(props: string): T

  protected getCacheKey = (...args: string[]) => `${this.cachePrefix}:${args.join(":")}`

  protected async addToCache(entity: T): Promise<void> {
    const idCacheKey = this.getCacheKey("id", entity.id)
    this.redisClient.setEx(idCacheKey, this.cacheDurationSeconds, this.serializeEntity(entity))
  }

  protected async removeFromCache(entity: T): Promise<void> {
    const idCacheKey = this.getCacheKey("id", entity.id)
    this.redisClient.del(idCacheKey)
  }
}
