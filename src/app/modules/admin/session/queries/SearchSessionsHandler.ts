import { Session } from "~/domain/entities"
import { SessionRepository } from "~/domain/repositories"
import { Query, QueryResult } from "~/lib/types"

export type SearchSessionsQuery = Query<Session>

export type SearchSessionsResult = QueryResult<Session>

export class SearchSessionsHandler {
  constructor(private readonly sessionRepository: SessionRepository) {}

  async execute(query: SearchSessionsQuery): Promise<SearchSessionsResult> {
    return await this.sessionRepository.query(query)
  }
}
