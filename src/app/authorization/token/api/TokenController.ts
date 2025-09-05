import { Request, Response } from "express"
import { Controller, HandleOAuthErrors, Post } from "~/app/decorators"
import { SecureCookieManager } from "~/app/shared/utils/SecureCookieManager"
import { TokenResponse } from "~/domain/adapters"
import { InvalidOperationError } from "~/domain/errors"
import { IssueTokenWithActiveSessionHandler } from "../commands/IssueTokenWithActiveSessionHandler"
import { IssueTokenWithClientCredentialsHandler } from "../commands/IssueTokenWithClientCredentialsHandler"
import { IssueTokenWithTokenExchangeHandler } from "../commands/IssueTokenWithTokenExchangeHandler"

const GrantType = {
  ClientCredentials: "client_credentials",
  SessionCookie: "urn:ietf:params:oauth:grant-type:luxury-escapes-session-cookie",
  TokenExchange: "urn:ietf:params:oauth:grant-type:token-exchange",
} as const

const SubjectTokenType = {
  AccessToken: "urn:ietf:params:oauth:token-type:access_token",
} as const

type TokenRequest = (
  | {
      grant_type: typeof GrantType.SessionCookie
      subject_to_impersonate_id?: string
    }
  | {
      grant_type: typeof GrantType.ClientCredentials
      client_id: string
      client_secret: string
    }
  | {
      grant_type: typeof GrantType.TokenExchange
      subject_token_type: typeof SubjectTokenType.AccessToken
      subject_token: string
      actor_token: string | undefined
      actor_token_type: string | undefined
    }
) & {
  audience?: string
  scope?: string
}

@Controller("/oauth2/token")
export class TokenController {
  constructor(
    private readonly secureCookieManager: SecureCookieManager,
    private readonly issueTokenWithActiveSessionHandler: IssueTokenWithActiveSessionHandler,
    private readonly issueTokenWithClientCredentialsHandler: IssueTokenWithClientCredentialsHandler,
    private readonly issueTokenWithTokenExchangeHandler: IssueTokenWithTokenExchangeHandler,
  ) {}

  @Post("/")
  @HandleOAuthErrors()
  async getAccessToken(req: Request, res: Response) {
    const body = req.body as TokenRequest

    let result: TokenResponse | undefined

    if (body.grant_type === GrantType.SessionCookie) {
      const cookie = this.secureCookieManager.getSessionCookie(req, res)
      result = await this.issueTokenWithActiveSessionHandler.execute({
        sessionId: cookie.id,
        nonce: cookie.nonce,
        userToImpersonateId: body.subject_to_impersonate_id,
        audience: body.audience,
        scope: body.scope,
      })
    }

    if (body.grant_type === GrantType.ClientCredentials) {
      result = await this.issueTokenWithClientCredentialsHandler.execute({
        clientId: body.client_id,
        clientSecret: body.client_secret,
        audience: body.audience,
        scope: body.scope,
      })
    }

    if (body.grant_type === GrantType.TokenExchange) {
      result = await this.issueTokenWithTokenExchangeHandler.execute({
        token: body.subject_token,
        audience: body.audience,
        scope: body.scope,
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
