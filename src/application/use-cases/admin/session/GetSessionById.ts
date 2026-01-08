import { Session } from '~/domain/entities';
import { SessionRepository } from '~/domain/repositories';

export interface GetSessionByIdQuery {
  id: string;
}

export type GetSessionById = ReturnType<typeof getSessionById>;

export const getSessionById = (sessionRepository: SessionRepository) => {
  return async (query: GetSessionByIdQuery): Promise<Session> => {
    return await sessionRepository.getById(query.id);
  };
};
