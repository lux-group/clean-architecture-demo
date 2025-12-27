import { AuthClientFactory, EventPublisher, SignOutState } from '~/application/ports';
import { IdentityProvider, Session } from '~/domain/entities';
import { AuthenticationError } from '~/domain/errors';
import { SessionEvent } from '~/domain/events';
import { IdentityProviderRepository, SessionRepository } from '~/domain/repositories';

export interface CreateSignOutRequestCommand {
  sessionId: string;
  nonce: string;
  redirectUrl: string;
}

export interface CreateSignOutRequestResult {
  url: string;
  signOutState?: SignOutState;
}

export class CreateSignOutRequestHandler {
  constructor(
    private readonly authClientFactory: AuthClientFactory,
    private readonly eventPublisher: EventPublisher,
    private readonly identityProviderRepository: IdentityProviderRepository,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(command: CreateSignOutRequestCommand): Promise<CreateSignOutRequestResult> {
    try {
      const session = await this.sessionRepository.tryGetById(command.sessionId);
      if (!session || !Session.isActive(session)) {
        return { url: command.redirectUrl };
      }

      Session.ensureIsIdentityProviderSession(session);

      const idp = await this.identityProviderRepository.getById(session.identityProviderId!);
      IdentityProvider.verifyRedirectUrl(idp, command.redirectUrl);

      const terminated = Session.terminateIdentityProviderSessionByUser(session);
      await this.sessionRepository.update(terminated);

      this.eventPublisher.publishEvent(SessionEvent.sessionTerminatedByUser(terminated));

      const client = this.authClientFactory.createClient(idp);
      if (!client.supportsSignOut) {
        return { url: command.redirectUrl };
      }

      return await client.createSignOutRequest(command.redirectUrl, terminated.idToken!);
    } catch (error: unknown) {
      if (error instanceof AuthenticationError) {
        this.eventPublisher.publishEvent(error.toEvent());
      }

      throw error;
    }
  }
}
