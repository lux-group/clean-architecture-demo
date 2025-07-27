import { randomUUID } from "node:crypto"
import jwt from "jsonwebtoken"
import { UUIDToShort } from "~/lib/ShortUUID"
import { User } from "~/domain/entities"
import { TokenIssuer, TokenRequest, TokenResponse } from "~/domain/adapters"

interface TokenIssuerConfig {
  readonly lifetimeSeconds: number
  readonly audience: string
}

export class JsonWebTokenIssuer implements TokenIssuer {
  constructor(
    private readonly baseUrl: string,
    private readonly tokenIssuerConfig: TokenIssuerConfig,
  ) {}

  createAccessTokenV2(user: User, request: TokenRequest): TokenResponse {
    const now = Math.round(Date.now() / 1000)
    const claims: Record<string, unknown> = {
      ver: "2.0",
      jti: UUIDToShort(randomUUID()),
      iss: this.baseUrl + "/oauth2",
      aud: request.audience ?? this.tokenIssuerConfig.audience,
      sub: user.id,
      sid: request.sessionId,
      iat: now,
      exp: now + this.tokenIssuerConfig.lifetimeSeconds,
      scope: request.scopes?.join(" "),
      ...request.claims
    }

    // We shorten the key ID to save size.
    // Make sure the same thing is done in the JWKS endpoint.
    const kid = UUIDToShort(request.signingKeyId)

    const accessToken = jwt.sign(claims, request.signingPrivateKey!, { algorithm: "RS256", keyid: kid })

    return { accessToken, expiresIn: this.tokenIssuerConfig.lifetimeSeconds }
  }
}