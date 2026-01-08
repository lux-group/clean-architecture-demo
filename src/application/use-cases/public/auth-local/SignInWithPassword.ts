import { EventPublisher, PasswordVerifier, SessionConfig } from '~/application/ports';
import { CreateSessionProps, Session } from '~/domain/entities';
import { AuthenticationError } from '~/domain/errors';
import { AuthenticationEvent, SessionEvent } from '~/domain/events';
import { SessionRepository, UserRepository } from '~/domain/repositories';
import { AuthenticationService } from '~/domain/services';

export interface SignInWithPasswordCommand {
  brand: string;
  email: string;
  password: string;
}

export type SignInWithPassword = ReturnType<typeof signInWithPassword>;

export const signInWithPassword = (
  authenticationService: AuthenticationService,
  eventPublisher: EventPublisher,
  passwordVerifier: PasswordVerifier,
  sessionConfig: SessionConfig,
  sessionRepository: SessionRepository,
  userRepository: UserRepository,
) => {
  return async (command: SignInWithPasswordCommand): Promise<Session> => {
    try {
      let user = await userRepository.tryGetByBrandAndEmail(command.brand, command.email);

      user = authenticationService.authenticateWithPassword(user, command.password, passwordVerifier.verifyPassword);

      const props: CreateSessionProps = {
        userId: user.id,
        identityProviderId: null,
        identityProviderSessionId: null,
        idToken: null,
        refreshToken: null,
      };

      const session = Session.createNew(props, sessionConfig.localSessionLifetimeHours);
      await sessionRepository.insert(session);

      eventPublisher.publishEvent(AuthenticationEvent.passwordVerified(user.id));
      eventPublisher.publishEvent(SessionEvent.sessionCreated(session));

      return session;
    } catch (error: unknown) {
      if (error instanceof AuthenticationError) {
        eventPublisher.publishEvent(error.toEvent());
      }

      throw error;
    }
  };
};
