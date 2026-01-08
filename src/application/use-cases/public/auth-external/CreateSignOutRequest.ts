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

export type CreateSignOutRequest = ReturnType<typeof createSignOutRequest>;

export const createSignOutRequest = (
  authClientFactory: AuthClientFactory,
  eventPublisher: EventPublisher,
  identityProviderRepository: IdentityProviderRepository,
  sessionRepository: SessionRepository,
) => {
  return async (command: CreateSignOutRequestCommand): Promise<CreateSignOutRequestResult> => {
    try {
      const session = await sessionRepository.tryGetById(command.sessionId);
      if (!session || !Session.isActive(session)) {
        return { url: command.redirectUrl };
      }

      Session.ensureIsIdentityProviderSession(session);

      const idp = await identityProviderRepository.getById(session.identityProviderId!);
      IdentityProvider.verifyRedirectUrl(idp, command.redirectUrl);

      const terminated = Session.terminateIdentityProviderSessionByUser(session);
      await sessionRepository.update(terminated);

      eventPublisher.publishEvent(SessionEvent.sessionTerminatedByUser(terminated));

      const client = authClientFactory.createClient(idp);
      if (!client.supportsSignOut) {
        return { url: command.redirectUrl };
      }

      return await client.createSignOutRequest(command.redirectUrl, terminated.idToken!);
    } catch (error: unknown) {
      if (error instanceof AuthenticationError) {
        eventPublisher.publishEvent(error.toEvent());
      }

      throw error;
    }
  };
};
