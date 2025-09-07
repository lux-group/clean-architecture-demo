import { Session } from "~/domain/entities"
import { SessionRepository } from "~/domain/repositories"

export interface GetSessionByIdQuery {
  id: string
}

export class GetSessionByIdHandler {
  constructor(private readonly sessionRepository: SessionRepository) {}

  async execute(query: GetSessionByIdQuery): Promise<Session> {
    return await this.sessionRepository.getById(query.id)
  }
}
