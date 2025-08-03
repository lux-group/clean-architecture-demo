import { beforeEach, describe, expect, it, vi } from "vitest"
import * as client from "openid-client"
import jwt from "jsonwebtoken"
import * as factories from "@test/factories"
import { IdentityProvider, IdentityProviderType } from "~/domain/entities"
import { AuthenticationError } from "~/domain/errors"
import { SignInState } from "~/domain/adapters"
import { OidcClient } from "./OidcClient"

// Mock the openid-client module using manual mock
vi.mock("openid-client")

// Get the mocked functions
const mockClient = client as any

// Mock global fetch for the editProfile method
const mockFetch = vi.fn()
global.fetch = mockFetch

describe("OidcClient", () => {
  let oidcClient: OidcClient
  let entraClient: OidcClient
  let identityProvider: IdentityProvider
  let entraIdentityProvider: IdentityProvider
  let mockClaims: any

  const baseUrl = "https://auth.example.com"
  const redirectUrl = "https://app.example.com/callback"

  beforeEach(() => {
    vi.clearAllMocks()

    // Create test identity providers
    identityProvider = factories.createIdentityProvider({
      name: "Google",
      issuerUrl: "https://accounts.google.com",
      audience: "google-client-id",
      identifierClaimName: "sub",
      authSettings: {
        type: IdentityProviderType.Google,
        brand: "google",
        clientId: "google-client-id",
        clientSecret: "google-client-secret",
        redirectUrls: ["https://auth.example.com/auth/external/sign-in-callback"],
        autoLinkUsers: false,
        autoCreateUsers: true,
      }
    })

    entraIdentityProvider = factories.createIdentityProvider({
      name: "Microsoft Entra",
      issuerUrl: "https://login.microsoftonline.com/tenant-id/v2.0",
      audience: "entra-client-id",
      identifierClaimName: "oid",
      authSettings: {
        type: IdentityProviderType.Entra,
        brand: "microsoft",
        clientId: "entra-client-id",
        clientSecret: "entra-client-secret",
        redirectUrls: ["https://auth.example.com/auth/external/sign-in-callback"],
        autoLinkUsers: false,
        autoCreateUsers: true,
      }
    })

    // Create OIDC clients
    oidcClient = new OidcClient(baseUrl, identityProvider, false)
    entraClient = new OidcClient(baseUrl, entraIdentityProvider, true)

    // Mock claims object
    mockClaims = {
      iss: identityProvider.issuerUrl,
      aud: identityProvider.audience,
      email: "test@example.com",
      given_name: "John",
      family_name: "Doe",
      sub: "google-user-123",
      oid: "entra-user-123"
    }

    // Mock OIDC configuration - cast to any to avoid type issues
    const mockConfig = {
      issuer: identityProvider.issuerUrl,
      authorization_endpoint: "https://accounts.google.com/oauth/authorize",
      token_endpoint: "https://oauth2.googleapis.com/token",
      end_session_endpoint: "https://accounts.google.com/logout"
    } as any

    // Mock openid-client functions
    mockClient.discovery.mockResolvedValue(mockConfig)
    mockClient.randomPKCECodeVerifier.mockReturnValue("mock-code-verifier")
    mockClient.calculatePKCECodeChallenge.mockResolvedValue("mock-code-challenge")
    mockClient.randomNonce.mockReturnValue("mock-nonce")
    mockClient.randomState.mockReturnValue("mock-state")
    mockClient.buildAuthorizationUrl.mockReturnValue(new URL("https://accounts.google.com/oauth/authorize?test=params"))
    mockClient.buildEndSessionUrl.mockReturnValue(new URL("https://accounts.google.com/logout?test=params"))
  })

  describe("constructor", () => {
    it("should create instance with correct properties for Google", () => {
      expect(oidcClient.supportsSignOut).toBe(false)
      expect(oidcClient.supportsEditProfile).toBe(false)
    })

    it("should create instance with correct properties for Entra", () => {
      expect(entraClient.supportsSignOut).toBe(true)
      expect(entraClient.supportsEditProfile).toBe(true)
    })
  })

  describe("createSignInRequest", () => {
    it("should create sign-in request for Google with correct parameters", async () => {
      const result = await oidcClient.createSignInRequest(redirectUrl)

      expect(mockClient.discovery).toHaveBeenCalledWith(
        new URL(identityProvider.issuerUrl),
        identityProvider.authSettings!.clientId,
        identityProvider.authSettings!.clientSecret
      )

      expect(mockClient.randomPKCECodeVerifier).toHaveBeenCalled()
      expect(mockClient.calculatePKCECodeChallenge).toHaveBeenCalledWith("mock-code-verifier")
      expect(mockClient.randomNonce).toHaveBeenCalled()
      expect(mockClient.randomState).toHaveBeenCalled()

      expect(mockClient.buildAuthorizationUrl).toHaveBeenCalled()

      // Check the URLSearchParams passed to buildAuthorizationUrl
      const callArgs = mockClient.buildAuthorizationUrl.mock.calls[0]
      const urlParams = callArgs[1] as URLSearchParams
      expect(urlParams.get("scope")).toBe("email openid profile")
      expect(urlParams.get("redirect_uri")).toBe(baseUrl + "/auth/external/sign-in-callback")
      expect(urlParams.get("code_challenge")).toBe("mock-code-challenge")
      expect(urlParams.get("code_challenge_method")).toBe("S256")
      expect(urlParams.get("nonce")).toBe("mock-nonce")
      expect(urlParams.get("state")).toBe("mock-state")

      expect(result.url).toBe("https://accounts.google.com/oauth/authorize?test=params")
      expect(result.signInState).toEqual({
        state: "mock-state",
        nonce: "mock-nonce",
        codeVerifier: "mock-code-verifier",
        redirectUrl,
        identityProviderId: identityProvider.id
      })
    })

    it("should create sign-in request for Entra with extended scope", async () => {
      await entraClient.createSignInRequest(redirectUrl)

      const callArgs = mockClient.buildAuthorizationUrl.mock.calls[0]
      const urlParams = callArgs[1] as URLSearchParams
      expect(urlParams.get("scope")).toBe("email openid profile offline_access User.ReadWrite")
    })

    it("should cache OIDC configuration", async () => {
      // Call twice with same identity provider
      await oidcClient.createSignInRequest(redirectUrl)
      await oidcClient.createSignInRequest(redirectUrl)

      // Discovery should only be called once due to caching
      expect(mockClient.discovery).toHaveBeenCalledTimes(1)
    })
  })

  describe("processSignInResponse", () => {
    let signInState: SignInState
    let mockTokenResult: any

    beforeEach(() => {
      signInState = {
        state: "test-state",
        nonce: "test-nonce",
        codeVerifier: "test-code-verifier",
        redirectUrl,
        identityProviderId: identityProvider.id
      }

      mockTokenResult = {
        id_token: "mock-id-token",
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
        claims: vi.fn().mockReturnValue(mockClaims)
      }

      mockClient.authorizationCodeGrant.mockResolvedValue(mockTokenResult as any)
    })

    it("should process successful sign-in response", async () => {
      const urlPath = "/auth/external/sign-in-callback?code=auth-code&state=test-state&session_state=session-123"

      const result = await oidcClient.processSignInResponse(signInState, urlPath)

      expect(mockClient.authorizationCodeGrant).toHaveBeenCalledWith(
        expect.anything(), // config
        new URL(baseUrl + urlPath),
        {
          expectedState: signInState.state,
          expectedNonce: signInState.nonce,
          pkceCodeVerifier: signInState.codeVerifier,
          idTokenExpected: true
        }
      )

      expect(result).toEqual({
        idToken: "mock-id-token",
        refreshToken: "mock-refresh-token",
        accessToken: "mock-access-token",
        sessionId: "session-123",
        profile: {
          identifierClaimValue: "google-user-123",
          email: "test@example.com",
          givenName: "John",
          surname: "Doe"
        }
      })
    })

    it("should handle missing optional tokens", async () => {
      // Create new mock without optional tokens
      const mockTokenResultWithoutOptionals = {
        id_token: "mock-id-token",
        claims: vi.fn().mockReturnValue(mockClaims)
      }
      mockClient.authorizationCodeGrant.mockResolvedValue(mockTokenResultWithoutOptionals as any)

      const urlPath = "/auth/external/sign-in-callback?code=auth-code&state=test-state"

      const result = await oidcClient.processSignInResponse(signInState, urlPath)

      expect(result.refreshToken).toBeUndefined()
      expect(result.accessToken).toBeUndefined()
      expect(result.sessionId).toBeNull()
    })

    it("should throw AuthenticationError for wrong issuer", async () => {
      mockClaims.iss = "https://wrong-issuer.com"

      await expect(
        oidcClient.processSignInResponse(signInState, "/auth/external/sign-in-callback?code=auth-code")
      ).rejects.toThrow(AuthenticationError)
      
      await expect(
        oidcClient.processSignInResponse(signInState, "/auth/external/sign-in-callback?code=auth-code")
      ).rejects.toThrow(`Expected issuer ${identityProvider.issuerUrl} but received https://wrong-issuer.com.`)
    })

    it("should throw AuthenticationError for wrong audience", async () => {
      mockClaims.aud = "wrong-audience"

      await expect(
        oidcClient.processSignInResponse(signInState, "/auth/external/sign-in-callback?code=auth-code")
      ).rejects.toThrow(AuthenticationError)
      
      await expect(
        oidcClient.processSignInResponse(signInState, "/auth/external/sign-in-callback?code=auth-code")
      ).rejects.toThrow(`Expected audience ${identityProvider.audience} but received wrong-audience.`)
    })

    it("should handle audience as array", async () => {
      mockClaims.aud = ["wrong-audience", "another-wrong-audience"]

      await expect(
        oidcClient.processSignInResponse(signInState, "/auth/external/sign-in-callback?code=auth-code")
      ).rejects.toThrow(AuthenticationError)
      
      await expect(
        oidcClient.processSignInResponse(signInState, "/auth/external/sign-in-callback?code=auth-code")
      ).rejects.toThrow(`Expected audience ${identityProvider.audience} but received wrong-audience, another-wrong-audience.`)
    })

    it("should accept correct audience in array", async () => {
      mockClaims.aud = [identityProvider.audience, "another-audience"]

      await expect(
        oidcClient.processSignInResponse(signInState, "/auth/external/sign-in-callback?code=auth-code")
      ).resolves.toBeDefined()
    })

    it("should throw error for missing email claim", async () => {
      delete mockClaims.email

      await expect(
        oidcClient.processSignInResponse(signInState, "/auth/external/sign-in-callback?code=auth-code")
      ).rejects.toThrow("Expected ID token claims not received. Check request scopes or token configuration in app registration.")
    })

    it("should throw error for missing identifier claim", async () => {
      delete mockClaims.sub

      await expect(
        oidcClient.processSignInResponse(signInState, "/auth/external/sign-in-callback?code=auth-code")
      ).rejects.toThrow("Expected ID token claims not received. Check request scopes or token configuration in app registration.")
    })

    it("should use correct identifier claim for Entra", async () => {
      const entraSignInState = {
        ...signInState,
        identityProviderId: entraIdentityProvider.id
      }

      mockClaims.iss = entraIdentityProvider.issuerUrl
      mockClaims.aud = entraIdentityProvider.audience
      delete mockClaims.sub

      const result = await entraClient.processSignInResponse(entraSignInState, "/auth/external/sign-in-callback?code=auth-code")

      expect(result.profile.identifierClaimValue).toBe("entra-user-123")
    })
  })

  describe("createSignOutRequest", () => {
    const idToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2dpbl9oaW50IjoidGVzdEBleGFtcGxlLmNvbSJ9.signature"

    beforeEach(() => {
      // Mock JWT decode for the getClaim method
      vi.spyOn(jwt, 'decode').mockReturnValue({
        header: { alg: 'RS256', typ: 'JWT' },
        payload: { login_hint: 'test@example.com' },
        signature: 'signature'
      } as jwt.Jwt)
    })

    it("should throw error for providers that don't support sign-out", async () => {
      await expect(
        oidcClient.createSignOutRequest(redirectUrl, idToken)
      ).rejects.toThrow("The identity provider does not support single-sign-out.")
    })

    it("should throw error when ID token is missing", async () => {
      await expect(
        entraClient.createSignOutRequest(redirectUrl)
      ).rejects.toThrow("ID Token is required for OIDC sign-out.")
    })

    it("should create sign-out request for Entra with logout_hint", async () => {
      const result = await entraClient.createSignOutRequest(redirectUrl, idToken)

      expect(mockClient.buildEndSessionUrl).toHaveBeenCalled()

      const callArgs = mockClient.buildEndSessionUrl.mock.calls[0]
      const urlParams = callArgs[1] as URLSearchParams
      expect(urlParams.get("post_logout_redirect_uri")).toBe(baseUrl + "/auth/external/sign-out-callback")
      expect(urlParams.get("logout_hint")).toBe("test@example.com")
      expect(urlParams.get("id_token_hint")).toBeNull()

      expect(result.url).toBe("https://accounts.google.com/logout?test=params")
      expect(result.signOutState).toEqual({
        identityProviderId: entraIdentityProvider.id,
        redirectUrl
      })
    })
  })

  describe("checkSessionWithRefreshToken", () => {
    it("should return valid session with new tokens", async () => {
      const refreshToken = "mock-refresh-token"
      const mockRefreshResult = {
        id_token: "new-id-token",
        refresh_token: "new-refresh-token"
      }

      mockClient.refreshTokenGrant.mockResolvedValue(mockRefreshResult as any)

      const result = await oidcClient.checkSessionWithRefreshToken(refreshToken)

      expect(mockClient.refreshTokenGrant).toHaveBeenCalledWith(expect.anything(), refreshToken)
      expect(result).toEqual({
        valid: true,
        idToken: "new-id-token",
        refreshToken: "new-refresh-token"
      })
    })

    it("should return invalid session on ResponseBodyError", async () => {
      const refreshToken = "invalid-refresh-token"
      const error = new client.ResponseBodyError("Invalid refresh token", {
        status: 400,
        headers: new Headers(),
        body: "error details"
      } as any)

      mockClient.refreshTokenGrant.mockRejectedValue(error)

      const result = await oidcClient.checkSessionWithRefreshToken(refreshToken)

      expect(result).toEqual({ valid: false })
    })

    it("should throw other errors", async () => {
      const refreshToken = "mock-refresh-token"
      const error = new Error("Network error")

      mockClient.refreshTokenGrant.mockRejectedValue(error)

      await expect(
        oidcClient.checkSessionWithRefreshToken(refreshToken)
      ).rejects.toThrow("Network error")
    })

    it("should handle missing optional tokens in refresh response", async () => {
      const refreshToken = "mock-refresh-token"
      const mockRefreshResult = {
        id_token: "new-id-token"
        // refresh_token is missing
      }

      mockClient.refreshTokenGrant.mockResolvedValue(mockRefreshResult as any)

      const result = await oidcClient.checkSessionWithRefreshToken(refreshToken)

      expect(result).toEqual({
        valid: true,
        idToken: "new-id-token",
        refreshToken: undefined
      })
    })
  })

  describe("editProfile", () => {
    const accessToken = "mock-access-token"

    it("should throw error for providers that don't support profile editing", async () => {
      await expect(
        oidcClient.editProfile(accessToken, "John", "Doe")
      ).rejects.toThrow("The identity provider does not support editing profiles.")
    })

    it("should successfully update profile for Entra", async () => {
      mockFetch.mockResolvedValue({
        ok: true
      } as Response)

      await entraClient.editProfile(accessToken, "John", "Doe")

      expect(mockFetch).toHaveBeenCalledWith(
        "https://graph.microsoft.com/v1.0/me",
        {
          method: "PATCH",
          headers: {
            "Authorization": "Bearer " + accessToken,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            surname: "Doe",
            givenName: "John"
          })
        }
      )
    })

    it("should throw error on failed HTTP response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403
      } as Response)

      await expect(
        entraClient.editProfile(accessToken, "John", "Doe")
      ).rejects.toThrow("Failed to update user profile. HTTP error 403")
    })
  })

  describe("configuration caching", () => {
    it("should cache configuration by identity provider ID and updatedAt", async () => {
      // Call with same identity provider multiple times
      await oidcClient.createSignInRequest(redirectUrl)
      await oidcClient.createSignInRequest(redirectUrl)
      await oidcClient.createSignInRequest(redirectUrl)

      // Discovery should only be called once
      expect(mockClient.discovery).toHaveBeenCalledTimes(1)
    })
  })

  describe("error handling", () => {
    it("should propagate discovery errors", async () => {
      const discoveryError = new Error("Discovery failed")
      mockClient.discovery.mockRejectedValue(discoveryError)

      await expect(
        oidcClient.createSignInRequest(redirectUrl)
      ).rejects.toThrow("Discovery failed")
    })

    it("should propagate authorization code grant errors", async () => {
      const signInState: SignInState = {
        state: "test-state",
        nonce: "test-nonce",
        codeVerifier: "test-code-verifier",
        redirectUrl,
        identityProviderId: identityProvider.id
      }

      const grantError = new Error("Token exchange failed")
      mockClient.authorizationCodeGrant.mockRejectedValue(grantError)

      await expect(
        oidcClient.processSignInResponse(signInState, "/auth/external/sign-in-callback?code=auth-code")
      ).rejects.toThrow("Token exchange failed")
    })
  })

  describe("private methods", () => {
    describe("getClaim", () => {
      it("should extract claim from JWT token", () => {
        const token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2dpbl9oaW50IjoidGVzdEBleGFtcGxlLmNvbSIsImN1c3RvbSI6InZhbHVlIn0.signature"
        
        vi.spyOn(jwt, 'decode').mockReturnValue({
          header: { alg: 'RS256', typ: 'JWT' },
          payload: { 
            login_hint: 'test@example.com',
            custom: 'value'
          },
          signature: 'signature'
        } as jwt.Jwt)

        // Use reflection to test the private method
        const getClaimMethod = (entraClient as any).getClaim.bind(entraClient)
        
        expect(getClaimMethod(token, 'login_hint')).toBe('test@example.com')
        expect(getClaimMethod(token, 'custom')).toBe('value')
        expect(getClaimMethod(token, 'nonexistent')).toBeUndefined()
      })
    })
  })
})

