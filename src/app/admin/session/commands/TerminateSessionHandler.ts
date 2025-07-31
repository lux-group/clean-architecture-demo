import { Session } from "~/domain/entities"
import { SessionRepository } from "~/domain/repositories"

export interface TerminateSessionCommand {
  sessionId: string
}

export class TerminateSessionHandler {
  constructor(
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(commands: TerminateSessionCommand): Promise<Session> {
    const session = await this.sessionRepository.getById(commands.sessionId)
    session.terminateSessionByAdmin()
    await this.sessionRepository.update(session)
    return session
  }
}