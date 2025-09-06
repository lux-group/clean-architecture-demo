import { EventPublisher } from "~/domain/adapters"
import { SessionEvent } from "~/domain/events"
import { SessionRepository } from "~/domain/repositories"

export interface SignOutCommand {
  sessionId: string
  nonce: string
}

export class SignOutHandler {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: SignOutCommand): Promise<void> {
    const session = await this.sessionRepository.tryGetById(command.sessionId)
    if (!session || !session.isActive) {
      return
    }

    session.terminateLocalSessionByUser()
    await this.sessionRepository.update(session)
    this.eventPublisher.publishEvent(SessionEvent.sessionTerminatedByUser(session))
  }
}
