import { EventPublisher } from "~/app/adapters"
import { AuthenticationError } from "~/domain/errors"
import { SessionEvent } from "~/domain/events/SessionEvent"
import { SessionRepository } from "~/domain/repositories/SessionRepository"

export interface FrontChannelSignOutCommand {
  sid: string
}

export class FrontChannelSignOutHandler {
  constructor(
    private readonly eventPublisher: EventPublisher,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(command: FrontChannelSignOutCommand): Promise<void> {
    try {
      const session = await this.sessionRepository.tryGetByIdentityProviderSessionId(command.sid)
      if (!session?.isActive) {
        return
      }

      session.terminateSessionByIdentityProvider()
      await this.sessionRepository.update(session)

      this.eventPublisher.publishEvent(SessionEvent.sessionTerminatedByIdentityProvider(session))
    } catch (error: unknown) {
      if (error instanceof AuthenticationError) {
        this.eventPublisher.publishEvent(error.toEvent())
      }

      throw error
    }
  }
}
