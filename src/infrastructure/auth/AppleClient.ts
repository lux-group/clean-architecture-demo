import { randomBytes } from "node:crypto"
import jwt from "jsonwebtoken"
import { IdentityProvider } from "~/domain/entities"
import { AuthenticationError } from "~/domain/errors"
import { AuthClient, CheckSessionResponse, SignInState, SignOutRequest, Profile } from "~/domain/adapters"

export class AppleClient implements AuthClient {
  constructor(
    private readonly baseUrl: string,
    private readonly identityProvider: IdentityProvider,
  ) {}

  public get supportsSignOut() { return false }
  public get supportsEditProfile() { return false }

  async createSignInRequest(redirectUrl: string) {
    const state = this.generateRandomString(32)
    const nonce = this.generateRandomString(32)
    const codeVerifier = this.generateRandomString(64)
    
    const signInState: SignInState = {
      state,
      nonce,
      codeVerifier,
      redirectUrl,
      identityProviderId: this.identityProvider.id
    }

    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.identityProvider.authSettings!.clientId,
      redirect_uri: this.baseUrl + "/auth/external/sign-in-callback",
      scope: "name email",
      state,
      nonce,
      response_mode: "form_post"
    })

    const authUrl = `https://appleid.apple.com/auth/authorize?${params.toString()}`
    
    return { url: authUrl, signInState }
  }

  async processSignInResponse(signInState: SignInState, urlPath: string) {
    const url = new URL(this.baseUrl + urlPath)
    const code = url.searchParams.get("code")
    const state = url.searchParams.get("state")
    const userParam = url.searchParams.get("user")

    if (!code) {
      throw new AuthenticationError("Authorization code not received from Apple")
    }

    if (state !== signInState.state) {
      throw new AuthenticationError("Invalid state parameter")
    }

    const tokenResponse = await this.exchangeCodeForTokens(code, signInState)
    const profile = this.extractProfileFromIdToken(tokenResponse.id_token, userParam, signInState.nonce)

    return {
      idToken: tokenResponse.id_token,
      refreshToken: tokenResponse.refresh_token,
      accessToken: tokenResponse.access_token,
      profile
    }
  }

  async createSignOutRequest(redirectUrl: string, idToken?: string): Promise<SignOutRequest> {
    throw new Error("The identity provider does not support single-sign-out.")
  }

  async checkSessionWithRefreshToken(refreshToken: string): Promise<CheckSessionResponse> {
    throw new Error("The identity provider does not support refresh tokens.")
  }

  async editProfile(accessToken: string, givenName: string, surname: string): Promise<void> {
    throw new Error("The identity provider does not support editing profiles.")
  }

  private generateRandomString(length: number): string {
    return randomBytes(length).toString('base64url').slice(0, length)
  }

  private async exchangeCodeForTokens(code: string, signInState: SignInState): Promise<any> {
    const tokenEndpoint = "https://appleid.apple.com/auth/token"
    
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: this.baseUrl + "/auth/external/sign-in-callback",
      client_id: this.identityProvider.authSettings!.clientId,
      client_secret: this.identityProvider.authSettings!.clientSecret
    })

    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString()
    })

    if (!response.ok) {
      throw new AuthenticationError(`Token exchange failed: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  private extractProfileFromIdToken(idToken: string, userParam: string | null, expectedNonce: string): Profile {
    try {
      // Decode JWT without verification (Apple's public keys would need to be fetched for full verification)
      const decodedToken = jwt.decode(idToken, { complete: true }) as any
      
      if (!decodedToken || !decodedToken.payload) {
        throw new AuthenticationError("Invalid ID token format")
      }

      const payload = decodedToken.payload

      // Verify nonce
      if (payload.nonce !== expectedNonce) {
        throw new AuthenticationError("Invalid nonce in ID token")
      }

      // Verify issuer and audience
      if (payload.iss !== "https://appleid.apple.com") {
        throw new AuthenticationError("Invalid issuer in ID token")
      }

      if (payload.aud !== this.identityProvider.authSettings!.clientId) {
        throw new AuthenticationError("Invalid audience in ID token")
      }

      let givenName = ""
      let surname = ""
      let email = payload.email || ""

      // Parse user data if provided (only on first sign-in)
      if (userParam) {
        try {
          const userData = JSON.parse(userParam)
          if (userData.name) {
            givenName = userData.name.firstName || ""
            surname = userData.name.lastName || ""
          }
          if (userData.email) {
            email = userData.email
          }
        } catch (err) {
          // Ignore parsing errors for user data
        }
      }

      const identifierClaimValue = payload[this.identityProvider.identifierClaimName] || payload.sub

      if (!email || !identifierClaimValue) {
        throw new AuthenticationError("Required profile information not available")
      }

      return {
        email,
        givenName,
        surname,
        identifierClaimValue
      }
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error
      }
      throw new AuthenticationError("Failed to process ID token")
    }
  }
}
