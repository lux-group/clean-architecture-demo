import { EventPublisher } from '~/application/ports';
import { Session } from '~/domain/entities';
import { EntityChangeEvent } from '~/domain/events';
import { SessionRepository } from '~/domain/repositories';

export interface TerminateSessionCommand {
  sessionId: string;
}

export type TerminateSession = ReturnType<typeof terminateSession>;

export const terminateSession = (sessionRepository: SessionRepository, eventPublisher: EventPublisher) => {
  return async (command: TerminateSessionCommand): Promise<Session> => {
    const session = await sessionRepository.getById(command.sessionId);
    const terminated = Session.terminateSessionByAdmin(session);
    await sessionRepository.update(terminated);

    const event = EntityChangeEvent.entityUpdated('Session', terminated);
    eventPublisher.publishEvent(event);

    return terminated;
  };
};
