import { randomUUID } from "node:crypto"
import jwt from "jsonwebtoken"
import { TokenIssuer, TokenRequest, TokenResponse } from "~/app/shared/adapters"
import { SigningKeyRepository } from "~/domain/repositories"
import { UUIDToShort } from "~/lib/ShortUUID"
import { TokenIssuerConfig } from "../config"

export class JsonWebTokenIssuer implements TokenIssuer {
  constructor(
    private readonly baseUrl: string,
    private readonly tokenIssuerConfig: TokenIssuerConfig,
    private readonly signingKeyRepository: SigningKeyRepository,
  ) {}

  async createAccessToken(request: TokenRequest): Promise<TokenResponse> {
    const signingKey = await this.signingKeyRepository.tryGetActiveSigningKey()
    if (!signingKey || !signingKey.privateKey) {
      throw new Error("No active signing key found.")
    }

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
      ...request.customClaims,
    }

    // We shorten the key ID to save size.
    // Make sure the same thing is done in the JWKS endpoint.
    const kid = UUIDToShort(signingKey.id)

    const accessToken = jwt.sign(claims, signingKey.privateKey!, { algorithm: "RS256", keyid: kid })

    return { accessToken, expiresIn: this.tokenIssuerConfig.lifetimeSeconds, claims }
  }
}
