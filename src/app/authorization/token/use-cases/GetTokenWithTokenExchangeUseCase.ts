import { AuthenticationService, AuthorizationService } from "~/domain/services"

export interface GetTokenWithTokenExchangeInput {
  token: string
  audience?: string
  scope?: string
}

export interface GetTokenWithTokenExchangeOutput {
  accessToken: string
  expiresIn: number
}

export class GetTokenWithTokenExchangeUseCase {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly authorizationService: AuthorizationService,
  ) { }

  async execute(input: GetTokenWithTokenExchangeInput): Promise<GetTokenWithTokenExchangeOutput> {
    const user = await this.authenticationService.authenticateWithExternalIdentityToken(
      input.token)

    const accessToken = await this.authorizationService.issueAccessToken(
      user,
      undefined,
      undefined,
      input.audience,
      input.scope)

    return accessToken
  }
}
