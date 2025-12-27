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

export class IssueTokenWithClientCredentialsHandler {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly eventPublisher: EventPublisher,
    private readonly passwordVerifier: PasswordVerifier,
    private readonly tokenIssuer: TokenIssuer,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: IssueTokenWithClientCredentialsInput): Promise<IssueTokenWithClientCredentialsResult> {
    try {
      const user = await this.authenticate(command.clientId, command.clientSecret);

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

      this.eventPublisher.publishEvent(AuthenticationEvent.clientCredentialsVerified(user.id));
      this.eventPublisher.publishEvent(AuthorizationEvent.tokenIssued(response.claims, user.id));

      return response;
    } catch (error: unknown) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        this.eventPublisher.publishEvent(error.toEvent());
      }

      throw error;
    }
  }

  private async authenticate(clientId: string, clientSecret: string) {
    const user = await this.userRepository.tryGetById(clientId);
    return this.authenticationService.authenticateWithClientSecret(
      user,
      clientSecret,
      this.passwordVerifier.verifyPassword,
    );
  }
}
