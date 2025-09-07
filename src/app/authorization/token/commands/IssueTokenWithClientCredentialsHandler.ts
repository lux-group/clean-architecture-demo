import { EventPublisher, TokenResponse } from "~/domain/adapters"
import { AuthenticationError, AuthorizationError } from "~/domain/errors"
import { AuthenticationEvent, AuthorizationEvent } from "~/domain/events"
import { UserRepository } from "~/domain/repositories"
import { AuthenticationService, AuthorizationService } from "~/domain/services"

export interface IssueTokenWithClientCredentialsInput {
  clientId: string
  clientSecret: string
  audience?: string
  scope?: string
}

export type IssueTokenWithClientCredentialsResult = TokenResponse

export class IssueTokenWithClientCredentialsHandler {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly authorizationService: AuthorizationService,
    private readonly eventPublisher: EventPublisher,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: IssueTokenWithClientCredentialsInput): Promise<IssueTokenWithClientCredentialsResult> {
    try {
      const user = await this.authenticate(command.clientId, command.clientSecret)

      const response = await this.authorizationService.issueAccessToken(
        user,
        undefined,
        undefined,
        command.audience,
        command.scope,
      )

      this.eventPublisher.publishEvent(AuthenticationEvent.clientCredentialsVerified(user.id))
      this.eventPublisher.publishEvent(AuthorizationEvent.tokenIssued(response.claims, user.id))

      return response
    } catch (error: unknown) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        this.eventPublisher.publishEvent(error.toEvent())
      }

      throw error
    }
  }

  private async authenticate(clientId: string, clientSecret: string) {
    const user = await this.userRepository.tryGetById(clientId)
    return this.authenticationService.authenticateWithClientSecret(user, clientSecret)
  }
}
