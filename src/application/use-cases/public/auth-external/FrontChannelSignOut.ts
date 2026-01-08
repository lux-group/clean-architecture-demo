import { EventPublisher } from '~/application/ports';
import { Session } from '~/domain/entities';
import { AuthenticationError } from '~/domain/errors';
import { SessionEvent } from '~/domain/events/SessionEvent';
import { SessionRepository } from '~/domain/repositories/SessionRepository';

export interface FrontChannelSignOutCommand {
  sid: string;
}

export type FrontChannelSignOut = ReturnType<typeof frontChannelSignOut>;

export const frontChannelSignOut = (eventPublisher: EventPublisher, sessionRepository: SessionRepository) => {
  return async (command: FrontChannelSignOutCommand): Promise<void> => {
    try {
      const session = await sessionRepository.tryGetByIdentityProviderSessionId(command.sid);
      if (!session || !Session.isActive(session)) {
        return;
      }

      const terminated = Session.terminateSessionByIdentityProvider(session);
      await sessionRepository.update(terminated);

      eventPublisher.publishEvent(SessionEvent.sessionTerminatedByIdentityProvider(terminated));
    } catch (error: unknown) {
      if (error instanceof AuthenticationError) {
        eventPublisher.publishEvent(error.toEvent());
      }

      throw error;
    }
  };
};
