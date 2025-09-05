import jwt from "jsonwebtoken"
import * as client from "openid-client"
import { AuthClient, SignInResponse, SignInState, SignOutState } from "~/domain/adapters"
import { IdentityProvider } from "~/domain/entities"
import { AuthenticationError } from "~/domain/errors"
import { ClientCache } from "~/lib/ClientCache"

const oidcConfigCache = new ClientCache<IdentityProvider, client.Configuration>(async idp =>
  client.discovery(new URL(idp.issuerUrl), idp.authSettings!.clientId, idp.authSettings!.clientSecret),
)

export class OidcClient implements AuthClient {
  constructor(
    private readonly baseUrl: string,
    private readonly identityProvider: IdentityProvider,
    private readonly isEntra: boolean,
  ) {}

  public get supportsSignOut() {
    return this.isEntra
  }
  public get supportsEditProfile() {
    return this.isEntra
  }

  async createSignInRequest(redirectUrl: string) {
    const codeVerifier = client.randomPKCECodeVerifier()
    const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier)
    const nonce = client.randomNonce()
    const state = client.randomState()
    const signInState: SignInState = {
      state,
      nonce,
      codeVerifier,
      redirectUrl,
      identityProviderId: this.identityProvider.id,
    }

    const config = await oidcConfigCache.get(this.identityProvider)

    // Google does not support offline_access (refresh tokens).
    // For Entra, we need permission to write to the user's profile.
    const scope = this.isEntra ? "email openid profile offline_access User.ReadWrite" : "email openid profile"

    // There are additional options that can be useful:
    // - prompt:      Set to 'none' to attempt a silent login.
    // - login_hint:  Provide email address to skip the account selection step.
    // - domain_hint: Similar to login_hint but only requires an email domain.
    //
    // Additional scopes offline_access and User.Read/User.ReadWrite should be granted in Entra by admin consent.
    const params = new URLSearchParams({
      scope,
      redirect_uri: `${this.baseUrl}/auth/external/sign-in-callback`,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      nonce,
      state,
    })

    return { url: client.buildAuthorizationUrl(config, params).href, signInState }
  }

  async processSignInResponse(signInState: SignInState, urlPath: string) {
    const url = new URL(this.baseUrl + urlPath)

    const checks = {
      expectedState: signInState.state,
      expectedNonce: signInState.nonce,
      pkceCodeVerifier: signInState.codeVerifier,
      idTokenExpected: true,
    }

    const config = await oidcConfigCache.get(this.identityProvider)
    const result = await client.authorizationCodeGrant(config, url, checks)
    const claims = result.claims()!

    if (claims.iss !== this.identityProvider.issuerUrl) {
      throw new AuthenticationError(`Expected issuer ${this.identityProvider.issuerUrl} but received ${claims.iss}.`)
    }

    const audienceList = Array.isArray(claims.aud) ? claims.aud : [claims.aud]
    if (!audienceList.includes(this.identityProvider.audience)) {
      throw new AuthenticationError(`Expected audience ${this.identityProvider.audience} but received ${audienceList.join(", ")}.`)
    }

    const sessionId = url.searchParams.get("session_state") as string
    const email = claims.email as string
    const givenName = claims.given_name as string
    const surname = claims.family_name as string
    const identifierClaimValue = claims[this.identityProvider.identifierClaimName] as string

    if (!email || !identifierClaimValue) {
      throw new Error("Expected ID token claims not received. Check request scopes or token configuration in app registration.")
    }

    const response: SignInResponse = {
      idToken: result.id_token!,
      refreshToken: result.refresh_token,
      accessToken: result.access_token,
      sessionId,
      profile: {
        identifierClaimValue,
        email,
        givenName,
        surname,
      },
    }

    return response
  }

  async createSignOutRequest(redirectUrl: string, idToken?: string) {
    if (!this.supportsSignOut) {
      throw new Error("The identity provider does not support single-sign-out.")
    }

    if (!idToken) {
      throw new Error("ID Token is required for OIDC sign-out.")
    }

    const signOutState: SignOutState = {
      identityProviderId: this.identityProvider.id,
      redirectUrl,
    }

    const params = new URLSearchParams({
      post_logout_redirect_uri: `${this.baseUrl}/auth/external/sign-out-callback`,
    })

    if (this.isEntra) {
      params.append("logout_hint", this.getClaim(idToken, "login_hint"))
    } else {
      params.append("id_token_hint", idToken)
    }

    const config = await oidcConfigCache.get(this.identityProvider)
    return { url: client.buildEndSessionUrl(config, params).href, signOutState }
  }

  async checkSessionWithRefreshToken(refreshToken: string) {
    const config = await oidcConfigCache.get(this.identityProvider)

    try {
      const result = await client.refreshTokenGrant(config, refreshToken)
      return { valid: true, idToken: result.id_token, refreshToken: result.refresh_token }
    } catch (err) {
      if (err instanceof client.ResponseBodyError) {
        return { valid: false }
      }

      throw err
    }
  }

  async editProfile(accessToken: string, givenName: string, surname: string) {
    if (!this.supportsEditProfile) {
      throw new Error("The identity provider does not support editing profiles.")
    }

    const response = await fetch("https://graph.microsoft.com/v1.0/me", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        surname,
        givenName,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to update user profile. HTTP error ${response.status}`)
    }
  }

  private getClaim(token: string, name: string) {
    const decodedJwt = jwt.decode(token, { complete: true }) as jwt.Jwt
    const bodyClaims = decodedJwt.payload as jwt.JwtPayload
    return bodyClaims[name]
  }
}
