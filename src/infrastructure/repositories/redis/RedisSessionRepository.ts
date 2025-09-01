import { RedisClientType } from "redis"
import { ObjectTransformer, toDateObject, toISODateString } from "~/lib/ObjectTransformer"
import { Session } from "~/domain/entities"
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
    const props = ObjectTransformer.transform(session.props, [], [toISODateString])
    return JSON.stringify(props)
  }

  protected override deserializeEntity(data: string): Session {
    const props = ObjectTransformer.transform(JSON.parse(data), [], [toDateObject])
    return new Session(props)
  }
}
