import { randomUUID } from "node:crypto"
import jwt from "jsonwebtoken"
import { UUIDToShort } from "~/lib/ShortUUID"
import { SigningKey } from "~/domain/entities"
import { TokenIssuer, TokenIssuerConfig, TokenRequest, TokenResponse } from "~/domain/adapters"

export class JsonWebTokenIssuer implements TokenIssuer {
  constructor(
    private readonly baseUrl: string,
    private readonly tokenIssuerConfig: TokenIssuerConfig,
  ) {}

  createAccessToken(signingKey: SigningKey, request: TokenRequest): TokenResponse {
    const now = Math.round(Date.now() / 1000)
    const claims: Record<string, unknown> = {
      ver: "2.0",
      jti: UUIDToShort(randomUUID()),
      iss: this.baseUrl + this.tokenIssuerConfig.path,
      aud: request.audience ?? this.tokenIssuerConfig.audience,
      sub: request.userId,
      sid: request.sessionId,
      iat: now,
      exp: now + this.tokenIssuerConfig.lifetimeSeconds,
      scope: request.scopes?.join(" "),
      ...request.claims,
    }

    // We shorten the key ID to save size.
    // Make sure the same thing is done in the JWKS endpoint.
    const kid = UUIDToShort(signingKey.id)

    const accessToken = jwt.sign(claims, signingKey.privateKey!, { algorithm: "RS256", keyid: kid })

    return { accessToken, expiresIn: this.tokenIssuerConfig.lifetimeSeconds }
  }
}
