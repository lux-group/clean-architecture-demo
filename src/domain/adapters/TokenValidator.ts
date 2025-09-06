import { IdentityProvider } from "~/domain/entities"
import { Profile } from "./AuthClient"

export type TokenValidationResult =
  | {
      readonly isValid: true
      readonly identityProvider: IdentityProvider
      readonly profile: Profile
    }
  | {
      readonly isValid: false
      readonly error: string
    }

export interface TokenValidator {
  decodeAndValidateToken(token: string): Promise<TokenValidationResult>
}
