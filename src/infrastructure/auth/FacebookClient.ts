import { randomBytes } from "node:crypto"
import { AuthClient, CheckSessionResponse, Profile, SignInRequest, SignInState, SignOutRequest } from "~/domain/adapters"
import { IdentityProvider } from "~/domain/entities"
import { AuthenticationError } from "~/domain/errors"

export class FacebookClient implements AuthClient {
  constructor(
    private readonly baseUrl: string,
    private readonly identityProvider: IdentityProvider,
  ) {}

  public get supportsSignOut() {
    return false
  }
  public get supportsEditProfile() {
    return false
  }

  async createSignInRequest(redirectUrl: string): Promise<SignInRequest> {
    const state = this.generateRandomString(32)
    const nonce = this.generateRandomString(32)
    const codeVerifier = this.generateRandomString(64)

    const signInState: SignInState = {
      state,
      nonce,
      codeVerifier,
      redirectUrl,
      identityProviderId: this.identityProvider.id,
    }

    const params = new URLSearchParams({
      client_id: this.identityProvider.authSettings!.clientId,
      redirect_uri: `${this.baseUrl}/auth/external/sign-in-callback`,
      scope: "email public_profile",
      response_type: "code",
      state,
      nonce,
    })

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`

    return { url: authUrl, signInState }
  }

  async processSignInResponse(signInState: SignInState, urlPath: string) {
    const url = new URL(this.baseUrl + urlPath)
    const code = url.searchParams.get("code")
    const state = url.searchParams.get("state")
    const error = url.searchParams.get("error")

    if (error) {
      throw new AuthenticationError(`Facebook OAuth error: ${error}`)
    }

    if (!code) {
      throw new AuthenticationError("Authorization code not received from Facebook")
    }

    if (state !== signInState.state) {
      throw new AuthenticationError("Invalid state parameter")
    }

    // Exchange authorization code for access token
    const tokenResponse = await this.exchangeCodeForToken(code)

    // Get user profile information
    const profile = await this.getUserProfile(tokenResponse.access_token)

    return {
      idToken: "", // Facebook doesn't provide ID tokens in OAuth 2.0 flow
      refreshToken: undefined, // Facebook access tokens are long-lived but not refresh tokens
      accessToken: tokenResponse.access_token,
      profile,
    }
  }

  async createSignOutRequest(_redirectUrl: string, _idToken?: string): Promise<SignOutRequest> {
    throw new Error("The identity provider does not support single-sign-out.")
  }

  async checkSessionWithRefreshToken(_refreshToken: string): Promise<CheckSessionResponse> {
    throw new Error("The identity provider does not support refresh tokens.")
  }

  async editProfile(_accessToken: string, _givenName: string, _surname: string): Promise<void> {
    throw new Error("The identity provider does not support editing profiles.")
  }

  private generateRandomString(length: number): string {
    return randomBytes(length).toString("base64url").slice(0, length)
  }

  private async exchangeCodeForToken(code: string) {
    const tokenEndpoint = "https://graph.facebook.com/v18.0/oauth/access_token"

    const params = new URLSearchParams({
      client_id: this.identityProvider.authSettings!.clientId,
      client_secret: this.identityProvider.authSettings!.clientSecret,
      redirect_uri: `${this.baseUrl}/auth/external/sign-in-callback`,
      code,
    })

    const response = await fetch(`${tokenEndpoint}?${params.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    })

    if (!response.ok) {
      throw new AuthenticationError(`Token exchange failed: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  private async getUserProfile(accessToken: string): Promise<Profile> {
    const profileEndpoint = "https://graph.facebook.com/v18.0/me"

    const params = new URLSearchParams({
      access_token: accessToken,
      fields: "id,email,first_name,last_name",
    })

    const response = await fetch(`${profileEndpoint}?${params.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    })

    if (!response.ok) {
      throw new AuthenticationError(`Failed to fetch user profile: ${response.status} ${response.statusText}`)
    }

    const userData = await response.json()

    if (userData.error) {
      throw new AuthenticationError(`Facebook API error: ${userData.error.message}`)
    }

    const identifierClaimValue = userData[this.identityProvider.identifierClaimName] || userData.id
    const email = userData.email || ""
    const givenName = userData.first_name || ""
    const surname = userData.last_name || ""

    if (!email || !identifierClaimValue) {
      throw new AuthenticationError("Required profile information not available from Facebook")
    }

    return {
      email,
      givenName,
      surname,
      identifierClaimValue,
    }
  }
}
