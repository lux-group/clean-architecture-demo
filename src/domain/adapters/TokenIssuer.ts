import { SigningKey } from "~/domain/entities"

export interface TokenRequest {
  readonly userId: string
  readonly sessionId?: string
  readonly audience?: string
  readonly scopes?: string[]
  readonly claims: Record<string, unknown>
}

export interface TokenResponse {
  readonly accessToken: string
  readonly expiresIn: number
}

export interface TokenIssuerConfig {
  readonly path: string
  readonly lifetimeSeconds: number
  readonly audience: string
}

export interface TokenIssuer {
  createAccessToken(signingKey: SigningKey, request: TokenRequest): TokenResponse
}
