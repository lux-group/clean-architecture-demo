import { AuthenticationService, AuthorizationService } from "~/domain/services"

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
    private readonly authenticationService: AuthenticationService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(command: IssueTokenWithTokenExchangeInput): Promise<IssueTokenWithTokenExchangeResult> {
    const user = await this.authenticationService.authenticateWithExternalIdentityToken(command.token)

    const accessToken = await this.authorizationService.issueAccessToken(user, undefined, undefined, command.audience, command.scope)

    return accessToken
  }
}
