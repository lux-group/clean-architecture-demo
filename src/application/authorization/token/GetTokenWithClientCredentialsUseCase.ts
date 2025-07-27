import { AuthenticationService, AuthorizationService } from "~/domain/services"

export interface GetTokenWithClientCredentialsInput {
  clientId: string
  clientSecret: string
  audience?: string
  scope?: string
}

export interface GetTokenWithClientCredentialsOutput {
  accessToken: string
  expiresIn: number
}

export class GetTokenWithClientCredentialsUseCase {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly authorizationService: AuthorizationService,
  ) { }

  async execute(input: GetTokenWithClientCredentialsInput): Promise<GetTokenWithClientCredentialsOutput> {
    const user = await this.authenticationService.authenticateWithClientCredentials(
      input.clientId,
      input.clientSecret)

    const accessToken = await this.authorizationService.issueAccessToken(
      user,
      undefined,
      undefined,
      input.audience,
      input.scope)

    return accessToken
  }
}
