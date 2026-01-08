import { Session } from '~/domain/entities';
import { SessionRepository } from '~/domain/repositories';
import { Query, QueryResult } from '~/lib/types';

export type SearchSessionsQuery = Query<Session>;

export type SearchSessionsResult = QueryResult<Session>;

export type SearchSessions = ReturnType<typeof searchSessions>;

export const searchSessions = (sessionRepository: SessionRepository) => {
  return async (query: SearchSessionsQuery): Promise<SearchSessionsResult> => {
    return await sessionRepository.query(query);
  };
};
