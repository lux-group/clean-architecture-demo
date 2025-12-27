import { EventPublisher } from '~/application/ports';
import { Session } from '~/domain/entities';
import { EntityChangeEvent } from '~/domain/events';
import { SessionRepository } from '~/domain/repositories';

export interface TerminateSessionCommand {
  sessionId: string;
}

export class TerminateSessionHandler {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(commands: TerminateSessionCommand): Promise<Session> {
    const session = await this.sessionRepository.getById(commands.sessionId);
    const terminated = Session.terminateSessionByAdmin(session);
    await this.sessionRepository.update(terminated);

    const event = EntityChangeEvent.entityUpdated('Session', terminated);
    this.eventPublisher.publishEvent(event);

    return terminated;
  }
}
