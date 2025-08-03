import { Session } from "~/domain/entities"
import { SessionRepository } from "~/domain/repositories"

export interface SearchSessionsQuery {
  offset: number
  limit: number
}

export interface SearchSessionsResult {
  offset: number
  limit: number
  items: Session[]
}

export class SearchSessionsHandler {
  constructor(
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(query: SearchSessionsQuery): Promise<SearchSessionsResult> {
    const items = await this.sessionRepository.query(query.offset, query.limit)
    return {
      offset: query.offset,
      limit: query.limit,
      items
    }
  }
}
