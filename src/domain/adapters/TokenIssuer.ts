import { User } from "~/domain/entities"

export interface TokenRequest {
  readonly signingKeyId: string
  readonly signingPrivateKey: string
  readonly audience?: string
  readonly sessionId?: string
  readonly scopes?: string[]
  readonly claims: Record<string, unknown>
}

export interface TokenResponse {
  readonly accessToken: string
  readonly expiresIn: number
}

export interface TokenIssuer {
  createAccessTokenV2(user: User, request: TokenRequest): TokenResponse
}
