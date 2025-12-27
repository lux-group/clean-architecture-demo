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

export class IssueTokenWithTokenExchangeHandler {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly eventPublisher: EventPublisher,
    private readonly tokenIssuer: TokenIssuer,
    private readonly tokenValidator: TokenValidator,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: IssueTokenWithTokenExchangeInput): Promise<IssueTokenWithTokenExchangeResult> {
    try {
      const { claimValue, idp, user } = await this.authenticate(command.token);

      // This is where we would do authorization,
      // e.g. check requested audience and scopes.

      const response = await this.tokenIssuer.createAccessToken({
        version: command.version,
        userId: user.id,
        customClaims: {
          brand: user.brand,
          roles: user.roles,
        },
      });

      this.eventPublisher.publishEvent(AuthenticationEvent.externalTokenVerified(user.id, idp.id, claimValue));
      this.eventPublisher.publishEvent(AuthorizationEvent.tokenIssued(response.claims, user.id));

      return response;
    } catch (error: unknown) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        this.eventPublisher.publishEvent(error.toEvent());
      }

      throw error;
    }
  }

  private async authenticate(token: string) {
    const result = await this.tokenValidator.decodeAndValidateToken(token);
    const { identityProvider: idp, profile } = result;
    const claimValue = profile.identifierClaimValue;
    const user = await this.userRepository.tryGetByExternalIdentity(idp.id, claimValue);

    return {
      claimValue,
      idp,
      user: this.authenticationService.authenticateWithExternalToken(user, idp, claimValue),
    };
  }
}
