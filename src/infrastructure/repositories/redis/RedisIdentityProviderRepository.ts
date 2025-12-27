import { RedisClientType } from 'redis';
import { IdentityProvider } from '~/domain/entities';
import { IdentityProviderRepository } from '~/domain/repositories';
import { toDateObject, toISODateString, transformObject } from '~/lib/transformObject';
import { RedisRepository } from './RedisRepository';

export class RedisIdentityProviderRepository
  extends RedisRepository<IdentityProvider, IdentityProviderRepository>
  implements IdentityProviderRepository
{
  constructor(redisClient: RedisClientType, redisDecorated_identityProviderRepository: IdentityProviderRepository) {
    super('identity_provider', 3600, redisClient, redisDecorated_identityProviderRepository);
  }

  async tryGetByName(name: string): Promise<IdentityProvider | undefined> {
    const nameCacheKey = this.getCacheKey('name', name);
    const cached = await this.redisClient.get(nameCacheKey);
    if (cached) {
      return this.deserializeEntity(cached);
    }

    const identityProvider = await this.repository.tryGetByName(name);
    if (identityProvider) {
      await this.addToCache(identityProvider);
    }

    return identityProvider;
  }

  async tryGetByIssuerUrlAndAudience(issuerUrl: string, audience: string): Promise<IdentityProvider | undefined> {
    const issuerAudienceCacheKey = this.getCacheKey('issuer_audience', issuerUrl, audience);
    const cached = await this.redisClient.get(issuerAudienceCacheKey);
    if (cached) {
      return this.deserializeEntity(cached);
    }

    const identityProvider = await this.repository.tryGetByIssuerUrlAndAudience(issuerUrl, audience);

    if (identityProvider) {
      await this.addToCache(identityProvider);
    }

    return identityProvider;
  }

  protected override serializeEntity(identityProvider: IdentityProvider): string {
    const props = transformObject(identityProvider, [], [toISODateString]);
    return JSON.stringify(props);
  }

  protected override deserializeEntity(data: string): IdentityProvider {
    return transformObject(JSON.parse(data), [], [toDateObject]);
  }

  protected override async addToCache(idp: IdentityProvider): Promise<void> {
    const idCacheKey = this.getCacheKey('id', idp.id);
    const nameCacheKey = this.getCacheKey('name', idp.name);
    const issuerAudienceCacheKey = this.getCacheKey('issuer_audience', idp.issuerUrl, idp.audience);

    await Promise.all([
      this.redisClient.setEx(idCacheKey, this.cacheDurationSeconds, this.serializeEntity(idp)),
      this.redisClient.setEx(nameCacheKey, this.cacheDurationSeconds, this.serializeEntity(idp)),
      this.redisClient.setEx(issuerAudienceCacheKey, this.cacheDurationSeconds, this.serializeEntity(idp)),
    ]);
  }

  protected override async removeFromCache(idp: IdentityProvider): Promise<void> {
    const idCacheKey = this.getCacheKey('id', idp.id);
    const nameCacheKey = this.getCacheKey('name', idp.name);
    const issuerAudienceCacheKey = this.getCacheKey('issuer_audience', idp.issuerUrl, idp.audience);

    await Promise.all([
      this.redisClient.del(idCacheKey),
      this.redisClient.del(nameCacheKey),
      this.redisClient.del(issuerAudienceCacheKey),
    ]);
  }
}
