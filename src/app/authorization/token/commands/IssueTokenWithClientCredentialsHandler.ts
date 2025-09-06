import { EventPublisher, PasswordVerifier } from "~/domain/adapters"
import { AuthenticationError, commonErrors } from "~/domain/errors"
import { AuthenticationEvent } from "~/domain/events"
import { UserRepository } from "~/domain/repositories"
import { AuthorizationService } from "./AuthorizationService"

export interface IssueTokenWithClientCredentialsInput {
  clientId: string
  clientSecret: string
  audience?: string
  scope?: string
}

export interface IssueTokenWithClientCredentialsResult {
  accessToken: string
  expiresIn: number
}

export class IssueTokenWithClientCredentialsHandler {
  constructor(
    private readonly authorizationService: AuthorizationService,
    private readonly userRepository: UserRepository,
    private readonly eventPublisher: EventPublisher,
    private readonly passwordVerifier: PasswordVerifier,
  ) {}

  async execute(command: IssueTokenWithClientCredentialsInput): Promise<IssueTokenWithClientCredentialsResult> {
    const user = await this.userRepository.tryGetById(command.clientId)
    if (!user) {
      this.eventPublisher.publishEvent(AuthenticationEvent.clientCredentialsFailed(command.clientId))
      throw new AuthenticationError(commonErrors.authenticationFailed)
    }

    if (!user.canSignInWithClientSecret()) {
      this.eventPublisher.publishEvent(AuthenticationEvent.clientCredentialsMethodNotAllowed(command.clientId))
      throw new AuthenticationError(commonErrors.authenticationMethodNotAllowed)
    }

    if (!user.passwordHash || !this.passwordVerifier.verifyPassword(command.clientSecret, user.passwordHash)) {
      user.handleFailedSignInAttempt()
      this.eventPublisher.publishEvent(AuthenticationEvent.clientCredentialsFailed(command.clientId))
      throw new AuthenticationError(commonErrors.authenticationFailed)
    }

    this.eventPublisher.publishEvent(AuthenticationEvent.clientCredentialsSuccess(user))

    return await this.authorizationService.issueAccessToken(user, undefined, undefined, command.audience, command.scope)
  }
}
