import { Session } from "~/domain/entities"
import { SessionRepository } from "~/domain/repositories"

export interface GetSessionByIdInput {
  id: string
}

export class GetSessionByIdUseCase {
  constructor(
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(input: GetSessionByIdInput): Promise<Session> {
    return await this.sessionRepository.getById(input.id)
  }
}
