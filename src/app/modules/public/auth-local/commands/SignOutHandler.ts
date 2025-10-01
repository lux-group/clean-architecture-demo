import { EventPublisher } from "~/app/ports"
import { AuthenticationError } from "~/domain/errors"
import { SessionEvent } from "~/domain/events"
import { SessionRepository } from "~/domain/repositories"

export interface SignOutCommand {
  sessionId: string
  nonce: string
}

export class SignOutHandler {
  constructor(
    private readonly eventPublisher: EventPublisher,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(command: SignOutCommand): Promise<void> {
    try {
      const session = await this.sessionRepository.tryGetById(command.sessionId)
      if (!session?.isActive) {
        return
      }

      session.ensureIsLocalSession()
      session.verifyNonce(command.nonce)

      session.terminateLocalSessionByUser()
      await this.sessionRepository.update(session)

      this.eventPublisher.publishEvent(SessionEvent.sessionTerminatedByUser(session))
    } catch (error: unknown) {
      if (error instanceof AuthenticationError) {
        this.eventPublisher.publishEvent(error.toEvent())
      }

      throw error
    }
  }
}
