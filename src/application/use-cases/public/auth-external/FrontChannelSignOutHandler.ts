import { EventPublisher } from '~/application/ports';
import { Session } from '~/domain/entities';
import { AuthenticationError } from '~/domain/errors';
import { SessionEvent } from '~/domain/events/SessionEvent';
import { SessionRepository } from '~/domain/repositories/SessionRepository';

export interface FrontChannelSignOutCommand {
  sid: string;
}

export class FrontChannelSignOutHandler {
  constructor(
    private readonly eventPublisher: EventPublisher,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(command: FrontChannelSignOutCommand): Promise<void> {
    try {
      const session = await this.sessionRepository.tryGetByIdentityProviderSessionId(command.sid);
      if (!session || !Session.isActive(session)) {
        return;
      }

      const terminated = Session.terminateSessionByIdentityProvider(session);
      await this.sessionRepository.update(terminated);

      this.eventPublisher.publishEvent(SessionEvent.sessionTerminatedByIdentityProvider(terminated));
    } catch (error: unknown) {
      if (error instanceof AuthenticationError) {
        this.eventPublisher.publishEvent(error.toEvent());
      }

      throw error;
    }
  }
}
