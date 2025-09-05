import { AuthenticationService, AuthorizationService } from "~/domain/services"

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
    private readonly authenticationService: AuthenticationService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(command: IssueTokenWithClientCredentialsInput): Promise<IssueTokenWithClientCredentialsResult> {
    const user = await this.authenticationService.authenticateWithClientCredentials(command.clientId, command.clientSecret)

    const accessToken = await this.authorizationService.issueAccessToken(user, undefined, undefined, command.audience, command.scope)

    return accessToken
  }
}
