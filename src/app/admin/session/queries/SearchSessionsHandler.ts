import { Session } from "~/domain/entities"
import { SessionRepository } from "~/domain/repositories"

export interface SearchSessionsQuery {
  offset: number
  limit: number
}

export class SearchSessionsHandler {
  constructor(
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(query: SearchSessionsQuery): Promise<Session[]> {
    return await this.sessionRepository.query(query.offset, query.limit)
  }
}
