import { EventPublisher, TokenIssuer, TokenResponse, TokenValidator, TokenVersion } from '~/application/ports';
import { AuthenticationError, AuthorizationError } from '~/domain/errors';
import { AuthenticationEvent, AuthorizationEvent } from '~/domain/events';
import { UserRepository } from '~/domain/repositories';
import { AuthenticationService } from '~/domain/services';

export interface IssueTokenWithTokenExchangeInput {
  version: TokenVersion;
  token: string;
  audience?: string;
  scope?: string;
}

export type IssueTokenWithTokenExchangeResult = TokenResponse;

export type IssueTokenWithTokenExchange = ReturnType<typeof issueTokenWithTokenExchange>;

export const issueTokenWithTokenExchange = (
  authenticationService: AuthenticationService,
  eventPublisher: EventPublisher,
  tokenIssuer: TokenIssuer,
  tokenValidator: TokenValidator,
  userRepository: UserRepository,
) => {
  const authenticate = async (token: string) => {
    const result = await tokenValidator.decodeAndValidateToken(token);
    const { identityProvider: idp, profile } = result;
    const claimValue = profile.identifierClaimValue;
    const user = await userRepository.tryGetByExternalIdentity(idp.id, claimValue);

    return {
      claimValue,
      idp,
      user: authenticationService.authenticateWithExternalToken(user, idp, claimValue),
    };
  };

  return async (command: IssueTokenWithTokenExchangeInput): Promise<IssueTokenWithTokenExchangeResult> => {
    try {
      const { claimValue, idp, user } = await authenticate(command.token);

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

      eventPublisher.publishEvent(AuthenticationEvent.externalTokenVerified(user.id, idp.id, claimValue));
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
