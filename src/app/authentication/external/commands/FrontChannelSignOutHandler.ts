import { EventPublisher } from "~/domain/adapters/EventPublisher"
import { SessionEvent } from "~/domain/events/SessionEvent"
import { SessionRepository } from "~/domain/repositories/SessionRepository"

export interface FrontChannelSignOutCommand {
  sid: string
}

export class FrontChannelSignOutHandler {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: FrontChannelSignOutCommand): Promise<void> {
    const session = await this.sessionRepository.tryGetByIdentityProviderSessionId(command.sid)
    if (!session?.isActive) {
      return
    }

    session.terminateSessionByIdentityProvider()
    await this.sessionRepository.update(session)
    this.eventPublisher.publishEvent(SessionEvent.sessionTerminatedByIdentityProvider(session))
  }
}
