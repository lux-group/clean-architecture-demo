import { SigningKey, User } from "~/domain/entities"

export interface TokenRequest {
  readonly audience?: string
  readonly sessionId?: string
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
  createAccessToken(user: User, signingKey: SigningKey, request: TokenRequest): TokenResponse
}
