import { EventPublisher } from '~/application/ports';
import { Session } from '~/domain/entities';
import { AuthenticationError } from '~/domain/errors';
import { SessionEvent } from '~/domain/events';
import { SessionRepository } from '~/domain/repositories';

export interface SignOutCommand {
  sessionId: string;
  nonce: string;
}

export type SignOut = ReturnType<typeof signOut>;

export const signOut = (eventPublisher: EventPublisher, sessionRepository: SessionRepository) => {
  return async (command: SignOutCommand): Promise<void> => {
    try {
      const session = await sessionRepository.tryGetById(command.sessionId);
      if (!session || !Session.isActive(session)) {
        return;
      }

      Session.ensureIsLocalSession(session);
      Session.verifyNonce(session, command.nonce);

      const terminated = Session.terminateLocalSessionByUser(session);
      await sessionRepository.update(terminated);

      eventPublisher.publishEvent(SessionEvent.sessionTerminatedByUser(terminated));
    } catch (error: unknown) {
      if (error instanceof AuthenticationError) {
        eventPublisher.publishEvent(error.toEvent());
      }

      throw error;
    }
  };
};
