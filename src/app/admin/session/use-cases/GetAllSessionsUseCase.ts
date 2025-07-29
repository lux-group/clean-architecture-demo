import { Session } from "~/domain/entities"
import { SessionRepository } from "~/domain/repositories"

export class GetAllSessionsUseCase {
  constructor(
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(): Promise<Session[]> {
    return await this.sessionRepository.query()
  }
}
