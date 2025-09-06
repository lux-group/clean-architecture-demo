import { EventPublisher, TokenValidator } from "~/domain/adapters"
import { AuthenticationError, commonErrors } from "~/domain/errors"
import { AuthenticationEvent } from "~/domain/events"
import { UserRepository } from "~/domain/repositories"
import { AuthorizationService } from "./AuthorizationService"

export interface IssueTokenWithTokenExchangeInput {
  token: string
  audience?: string
  scope?: string
}

export interface IssueTokenWithTokenExchangeResult {
  accessToken: string
  expiresIn: number
}

export class IssueTokenWithTokenExchangeHandler {
  constructor(
    private readonly authorizationService: AuthorizationService,
    private readonly userRepository: UserRepository,
    private readonly eventPublisher: EventPublisher,
    private readonly tokenValidator: TokenValidator,
  ) {}

  async execute(command: IssueTokenWithTokenExchangeInput): Promise<IssueTokenWithTokenExchangeResult> {
    const result = await this.tokenValidator.decodeAndValidateToken(command.token)
    if (!result.isValid) {
      this.eventPublisher.publishEvent(AuthenticationEvent.identityProviderTokenFailed())
      throw new AuthenticationError(result.error)
    }

    const { identityProvider: idp, profile } = result
    const claimValue = profile.identifierClaimValue

    const user = await this.userRepository.tryGetByExternalIdentity(idp.id, claimValue)

    if (!user) {
      this.eventPublisher.publishEvent(AuthenticationEvent.identityProviderFailed(idp.id, claimValue))
      throw new AuthenticationError(commonErrors.authenticationFailed)
    }

    if (!user.canSignInWithIdentityProvider()) {
      this.eventPublisher.publishEvent(AuthenticationEvent.identityProviderMethodNotAllowed(user, idp.id, claimValue))
      throw new AuthenticationError(commonErrors.authenticationMethodNotAllowed)
    }

    this.eventPublisher.publishEvent(AuthenticationEvent.identityProviderSuccess(user, idp.id, claimValue))

    return await this.authorizationService.issueAccessToken(user, undefined, undefined, command.audience, command.scope)
  }
}
