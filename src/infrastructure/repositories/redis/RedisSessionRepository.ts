import { RedisClientType } from "redis"
import { Session, SessionProps } from "~/domain/entities"
import { SessionRepository } from "~/domain/repositories"
import { RedisRepository } from "./RedisRepository"

export class RedisSessionRepository extends RedisRepository<Session, SessionRepository> implements SessionRepository {
  constructor(
    redisClient: RedisClientType,
    redisDecorated_sessionRepository: SessionRepository
  ) {
    super("session", 3600, redisClient, redisDecorated_sessionRepository)
  }

  async tryGetByIdentityProviderSessionId(identityProviderSessionId: string): Promise<Session | undefined> {
    return await this.repository.tryGetByIdentityProviderSessionId(identityProviderSessionId)
  }

  protected override serializeEntity(session: Session): string {
    // TODO: Encrypt sensitive data (refresh token) before storing in Redis
    const props = session.props as SessionProps
    return JSON.stringify({
      ...props,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
      expiresAt: props.expiresAt.toISOString(),
      lastRefreshAt: props.lastRefreshAt.toISOString(),
      terminatedAt: props.terminatedAt ? props.terminatedAt.toISOString() : null,
    })
  }

  protected override deserializeEntity(data: string): Session {
    const props = JSON.parse(data)
    return new Session({
      ...props,
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt),
      expiresAt: new Date(props.expiresAt),
      lastRefreshAt: new Date(props.lastRefreshAt),
      terminatedAt: props.terminatedAt ? new Date(props.terminatedAt) : null,
    })
  }
}
