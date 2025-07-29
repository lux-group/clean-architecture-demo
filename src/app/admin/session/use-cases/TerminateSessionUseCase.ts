import { Session } from "~/domain/entities"
import { SessionRepository } from "~/domain/repositories"

export interface TerminateSessionInput {
  sessionId: string
}

export class TerminateSessionUseCase {
  constructor(
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(input: TerminateSessionInput): Promise<Session> {
    const session = await this.sessionRepository.getById(input.sessionId)
    session.terminateSessionByAdmin()
    await this.sessionRepository.update(session)
    return session
  }
}