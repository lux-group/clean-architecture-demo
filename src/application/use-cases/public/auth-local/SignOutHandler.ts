import { EventPublisher } from '~/application/ports';
import { Session } from '~/domain/entities';
import { AuthenticationError } from '~/domain/errors';
import { SessionEvent } from '~/domain/events';
import { SessionRepository } from '~/domain/repositories';

export interface SignOutCommand {
  sessionId: string;
  nonce: string;
}

export class SignOutHandler {
  constructor(
    private readonly eventPublisher: EventPublisher,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(command: SignOutCommand): Promise<void> {
    try {
      const session = await this.sessionRepository.tryGetById(command.sessionId);
      if (!session || !Session.isActive(session)) {
        return;
      }

      Session.ensureIsLocalSession(session);
      Session.verifyNonce(session, command.nonce);

      const terminated = Session.terminateLocalSessionByUser(session);
      await this.sessionRepository.update(terminated);

      this.eventPublisher.publishEvent(SessionEvent.sessionTerminatedByUser(terminated));
    } catch (error: unknown) {
      if (error instanceof AuthenticationError) {
        this.eventPublisher.publishEvent(error.toEvent());
      }

      throw error;
    }
  }
}
