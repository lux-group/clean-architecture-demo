import { Session } from "~/domain/entities"
import { SessionRepository } from "~/domain/repositories"
import { EventPublisher } from "~/domain/adapters"
import { EntityChangeEvent } from "~/domain/events"

export interface TerminateSessionCommand {
  sessionId: string
}

export class TerminateSessionHandler {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(commands: TerminateSessionCommand): Promise<Session> {
    const session = await this.sessionRepository.getById(commands.sessionId)
    session.terminateSessionByAdmin()
    await this.sessionRepository.update(session)

    const event = EntityChangeEvent.entityUpdated("Session", session)
    this.eventPublisher.publishEvent(event)

    return session
  }
}
