import { IdentityProvider } from "~/domain/entities"
import { Profile } from "./auth"

export interface TokenRequest {
  readonly userId: string
  readonly sessionId?: string
  readonly audience?: string
  readonly scopes?: string[]
  readonly customClaims: Record<string, unknown>
}

export interface TokenResponse {
  readonly accessToken: string
  readonly expiresIn: number
  readonly claims: Record<string, unknown>
}

export interface TokenIssuer {
  createAccessToken(request: TokenRequest): Promise<TokenResponse>
}

export interface TokenValidationResult {
  readonly identityProvider: IdentityProvider
  readonly profile: Profile
}

export interface TokenValidator {
  decodeAndValidateToken(token: string): Promise<TokenValidationResult>
}
