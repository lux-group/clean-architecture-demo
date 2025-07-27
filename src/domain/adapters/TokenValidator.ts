import { IdentityProvider } from "~/domain/entities"
import { Profile } from "./AuthClient"

export interface TokenValidationResult {
  readonly identityProvider: IdentityProvider
  readonly profile: Profile
}

export interface TokenValidator {
  decodeAndValidateToken(token: string): Promise<TokenValidationResult>
}
