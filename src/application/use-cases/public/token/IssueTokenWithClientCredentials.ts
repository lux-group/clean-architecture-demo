import { EventPublisher, PasswordVerifier, TokenIssuer, TokenResponse, TokenVersion } from '~/application/ports';
import { AuthenticationError, AuthorizationError } from '~/domain/errors';
import { AuthenticationEvent, AuthorizationEvent } from '~/domain/events';
import { UserRepository } from '~/domain/repositories';
import { AuthenticationService } from '~/domain/services';

export interface IssueTokenWithClientCredentialsInput {
  version: TokenVersion;
  clientId: string;
  clientSecret: string;
  audience?: string;
  scope?: string;
}

export type IssueTokenWithClientCredentialsResult = TokenResponse;

export type IssueTokenWithClientCredentials = ReturnType<typeof issueTokenWithClientCredentials>;

export const issueTokenWithClientCredentials = (
  authenticationService: AuthenticationService,
  eventPublisher: EventPublisher,
  passwordVerifier: PasswordVerifier,
  tokenIssuer: TokenIssuer,
  userRepository: UserRepository,
) => {
  const authenticate = async (clientId: string, clientSecret: string) => {
    const user = await userRepository.tryGetById(clientId);
    return authenticationService.authenticateWithClientSecret(user, clientSecret, passwordVerifier.verifyPassword);
  };

  return async (command: IssueTokenWithClientCredentialsInput): Promise<IssueTokenWithClientCredentialsResult> => {
    try {
      const user = await authenticate(command.clientId, command.clientSecret);

      // This is where we would do authorization,
      // e.g. check requested audience and scopes.

      const response = await tokenIssuer.createAccessToken({
        version: command.version,
        userId: user.id,
        customClaims: {
          brand: user.brand,
          roles: user.roles,
        },
      });

      eventPublisher.publishEvent(AuthenticationEvent.clientCredentialsVerified(user.id));
      eventPublisher.publishEvent(AuthorizationEvent.tokenIssued(response.claims, user.id));

      return response;
    } catch (error: unknown) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        eventPublisher.publishEvent(error.toEvent());
      }

      throw error;
    }
  };
};
