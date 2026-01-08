import { AuthClientFactory, EventPublisher, SignInState } from '~/application/ports';
import { CreateSessionProps, Session, User } from '~/domain/entities';
import { AuthenticationError } from '~/domain/errors';
import { AuthenticationEvent, EntityChangeEvent, SessionEvent } from '~/domain/events';
import { IdentityProviderRepository, SessionRepository, UserRepository } from '~/domain/repositories';
import { AuthenticationService } from '~/domain/services';

export interface ProcessSignInResponseCommand {
  state: SignInState;
  url: string;
}

export type ProcessSignInResponse = ReturnType<typeof processSignInResponse>;

export const processSignInResponse = (
  authClientFactory: AuthClientFactory,
  authenticationService: AuthenticationService,
  eventPublisher: EventPublisher,
  identityProviderRepository: IdentityProviderRepository,
  sessionRepository: SessionRepository,
  userRepository: UserRepository,
) => {
  return async (command: ProcessSignInResponseCommand): Promise<Session> => {
    try {
      const idp = await identityProviderRepository.getById(command.state.identityProviderId);
      const client = authClientFactory.createClient(idp);
      const signInResponse = await client.processSignInResponse(command.state, command.url);
      const profile = signInResponse.profile;
      const claimValue = profile.identifierClaimValue;

      let user = await userRepository.tryGetByExternalIdentity(idp.id, claimValue);
      if (!user) {
        // If the user cannot be found by the linked identity, check if we can find an existing
        // user with the same email address (Entra ID verifies email addresses) and if we find one,
        // link it automatically if this option is enabled for the IDP. This is useful data
        // migration of existing services but should not be used by new services.
        if (idp.authSettings!.autoLinkUsers) {
          const existingUser = await userRepository.tryGetByBrandAndEmail(idp.authSettings!.brand, profile.email);
          if (existingUser) {
            user = User.addIdentity(existingUser, idp.id, claimValue);
            await userRepository.update(user);

            const event = EntityChangeEvent.entityUpdated('User', user);
            eventPublisher.publishEvent(event);
          }
        }

        // If the user still doesn't exist, we automatically create it.
        if (!user && idp.authSettings!.autoCreateUsers) {
          const newUser = User.createNew({
            isEnabled: true,
            brand: idp.authSettings!.brand,
            givenName: profile.givenName,
            surname: profile.surname,
            email: profile.email,
            emailVerified: true,
            phone: null,
            country: null,
            city: null,
            postcode: null,
            roles: [],
            passwordHash: null,
          });

          user = User.addIdentity(newUser, idp.id, claimValue);
          await userRepository.insert(user);

          const event = EntityChangeEvent.entityCreated('User', user);
          eventPublisher.publishEvent(event);
        }

        // Because the user has signed in for the first time, we need to delete all
        // unnecessary user attributes from the Entra ID profile to reduce the amount
        // of PII we store and to avoid having to maintain them.
        if (client.supportsEditProfile && signInResponse.accessToken) {
          await client.editProfile(signInResponse.accessToken, null, null);
        }
      }

      user = authenticationService.authenticateWithIdentityProvider(user, idp, claimValue);

      const props: CreateSessionProps = {
        userId: user.id,
        identityProviderId: idp.id,
        identityProviderSessionId: signInResponse.sessionId ?? null,
        idToken: signInResponse.idToken,
        refreshToken: signInResponse.refreshToken ?? null,
      };

      const session = Session.createNew(props, idp.authSettings!.sessionLifetimeHours);
      await sessionRepository.insert(session);

      eventPublisher.publishEvent(AuthenticationEvent.identityProviderCodeVerified(user.id, idp.id, claimValue));
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
