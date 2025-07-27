import { IdentityProvider } from "~/domain/entities"

export interface Profile {
  readonly email: string
  readonly givenName: string
  readonly surname: string
  readonly identifierClaimValue: string
}

export interface SignInState {
  readonly state: string
  readonly nonce: string
  readonly codeVerifier: string
  readonly redirectUrl: string
  readonly identityProviderId: string
}

export interface SignInRequest {
  readonly url: string
  readonly signInState: SignInState
}

export interface SignInResponse {
  readonly profile: Profile
  readonly idToken: string
  readonly refreshToken?: string
  readonly accessToken?: string
  readonly sessionId?: string
}

export interface SignOutState {
  readonly redirectUrl: string
  readonly identityProviderId: string
}

export interface SignOutRequest {
  readonly url: string
  readonly signOutState: SignOutState
}

export interface CheckSessionResponse {
  readonly valid: boolean
  readonly idToken?: string
  readonly refreshToken?: string
}

export interface AuthClient {
  readonly supportsSignOut: boolean
  readonly supportsEditProfile: boolean
  createSignInRequest(redirectUrl: string): Promise<SignInRequest>
  createSignOutRequest(redirectUrl: string, idToken?: string): Promise<SignOutRequest>
  processSignInResponse(signInState: SignInState, url: string): Promise<SignInResponse>
  checkSessionWithRefreshToken(refreshToken: string): Promise<CheckSessionResponse>
  editProfile(accessToken: string, givenName: string | null, surname: string | null): Promise<void>
}

export interface AuthClientFactory {
  createClient(identityProvider: IdentityProvider): AuthClient
}
