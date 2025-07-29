import { Request, Response } from "express"
import { InvalidOperationError } from "~/domain/errors"
import { TokenResponse } from "~/domain/adapters"
import { SecureCookieManager } from "~/app/shared/utils/SecureCookieManager"
import { GetTokenWithActiveSessionUseCase } from "../use-cases/GetTokenWithActiveSessionUseCase"
import { GetTokenWithClientCredentialsUseCase } from "../use-cases/GetTokenWithClientCredentialsUseCase"
import { GetTokenWithTokenExchangeUseCase } from "../use-cases/GetTokenWithTokenExchangeUseCase"

const GrantType = {
  ClientCredentials: "client_credentials",
  SessionCookie: "urn:ietf:params:oauth:grant-type:luxury-escapes-session-cookie",
  TokenExchange: "urn:ietf:params:oauth:grant-type:token-exchange",
} as const

const SubjectTokenType = {
  AccessToken: "urn:ietf:params:oauth:token-type:access_token",
} as const

type TokenRequest = ({
  grant_type: typeof GrantType.SessionCookie
  subject_to_impersonate_id?: string
} | {
  grant_type: typeof GrantType.ClientCredentials
  client_id: string
  client_secret: string
} | {
  grant_type: typeof GrantType.TokenExchange
  subject_token_type: typeof SubjectTokenType.AccessToken
  subject_token: string
  actor_token: string | undefined
  actor_token_type: string | undefined
}) & {
  audience?: string
  scope?: string
}

export class TokenController {
  constructor(
    private readonly secureCookieManager: SecureCookieManager,
    private readonly getTokenWithActiveSessionUseCase: GetTokenWithActiveSessionUseCase,
    private readonly getTokenWithClientCredentialsUseCase: GetTokenWithClientCredentialsUseCase,
    private readonly getTokenWithTokenExchangeUseCase: GetTokenWithTokenExchangeUseCase,
  ) {}

  async getAccessToken(req: Request, res: Response) {
    const body = req.body as TokenRequest

    let result: TokenResponse | undefined = undefined

    if (body.grant_type == GrantType.SessionCookie) {
      const cookie = this.secureCookieManager.getSessionCookie(req, res)
      result = await this.getTokenWithActiveSessionUseCase.execute({
        sessionId: cookie.id,
        nonce: cookie.nonce,
        userToImpersonateId: body.subject_to_impersonate_id,
        audience: body.audience,
        scope: body.scope
      })
    }

    if (body.grant_type == GrantType.ClientCredentials) {
      result = await this.getTokenWithClientCredentialsUseCase.execute({
        clientId: body.client_id,
        clientSecret: body.client_secret,
        audience: body.audience,
        scope: body.scope
      })
    }

    if (body.grant_type == GrantType.TokenExchange) {
      result = await this.getTokenWithTokenExchangeUseCase.execute({
        token: body.subject_token,
        audience: body.audience,
        scope: body.scope
      })
    }

    if (!result) {
      throw new InvalidOperationError("Unsupported grant type")
    }

    res.status(200).json({
      token_type: "bearer",
      access_token: result.accessToken,
      expires_in: result.expiresIn,
    })
  }
}
