import * as factories from "@test/factories"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { SignInState } from "~/domain/adapters"
import { IdentityProvider, IdentityProviderType } from "~/domain/entities"
import { AuthenticationError } from "~/domain/errors"
import { FacebookClient } from "./FacebookClient"

// Mock global fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe("FacebookClient", () => {
  let facebookClient: FacebookClient
  let identityProvider: IdentityProvider

  const baseUrl = "https://auth.example.com"
  const redirectUrl = "https://app.example.com/callback"

  beforeEach(() => {
    vi.clearAllMocks()

    // Create test identity provider for Facebook
    identityProvider = factories.createIdentityProvider({
      name: "Facebook",
      issuerUrl: "https://www.facebook.com",
      audience: "facebook-client-id",
      identifierClaimName: "facebook_id", // Changed from "id" to meet minimum length requirement
      authSettings: {
        type: IdentityProviderType.Facebook,
        brand: "facebook",
        clientId: "facebook-client-id",
        clientSecret: "facebook-client-secret",
        redirectUrls: ["https://auth.example.com/auth/external/sign-in-callback"],
        autoLinkUsers: false,
        autoCreateUsers: true,
      },
    })

    // Create Facebook client
    facebookClient = new FacebookClient(baseUrl, identityProvider)
  })

  describe("constructor", () => {
    it("should create instance with correct properties", () => {
      expect(facebookClient.supportsSignOut).toBe(false)
      expect(facebookClient.supportsEditProfile).toBe(false)
    })
  })

  describe("createSignInRequest", () => {
    it("should create sign-in request with correct parameters", async () => {
      const result = await facebookClient.createSignInRequest(redirectUrl)

      expect(result.url).toContain("https://www.facebook.com/v18.0/dialog/oauth")
      expect(result.url).toContain("client_id=facebook-client-id")
      expect(result.url).toContain("redirect_uri=https%3A%2F%2Fauth.example.com%2Fauth%2Fexternal%2Fsign-in-callback")
      expect(result.url).toContain("scope=email+public_profile")
      expect(result.url).toContain("response_type=code")

      expect(result.signInState).toEqual({
        state: expect.any(String),
        nonce: expect.any(String),
        codeVerifier: expect.any(String),
        redirectUrl,
        identityProviderId: identityProvider.id,
      })

      // Verify that state and nonce are included in URL
      const url = new URL(result.url)
      expect(url.searchParams.get("state")).toBe(result.signInState.state)
      expect(url.searchParams.get("nonce")).toBe(result.signInState.nonce)
    })

    it("should generate random state, nonce, and code verifier", async () => {
      const result1 = await facebookClient.createSignInRequest(redirectUrl)
      const result2 = await facebookClient.createSignInRequest(redirectUrl)

      expect(result1.signInState.state).not.toBe(result2.signInState.state)
      expect(result1.signInState.nonce).not.toBe(result2.signInState.nonce)
      expect(result1.signInState.codeVerifier).not.toBe(result2.signInState.codeVerifier)
    })
  })

  describe("processSignInResponse", () => {
    let signInState: SignInState
    let mockTokenResponse: any
    let mockUserProfile: any

    beforeEach(() => {
      signInState = {
        state: "test-state",
        nonce: "test-nonce",
        codeVerifier: "test-code-verifier",
        redirectUrl,
        identityProviderId: identityProvider.id,
      }

      mockTokenResponse = {
        access_token: "mock-access-token",
        token_type: "bearer",
      }

      mockUserProfile = {
        id: "facebook-user-123",
        facebook_id: "facebook-user-123", // Add the identifier claim field
        email: "test@example.com",
        first_name: "John",
        last_name: "Doe",
      }

      // Mock token exchange response
      mockFetch.mockImplementation((url: string) => {
        if (url.includes("oauth/access_token")) {
          return Promise.resolve({
            ok: true,
            json: vi.fn().mockResolvedValue(mockTokenResponse),
          } as any)
        }
        // Mock profile fetch response
        if (url.includes("/me")) {
          return Promise.resolve({
            ok: true,
            json: vi.fn().mockResolvedValue(mockUserProfile),
          } as any)
        }
        return Promise.reject(new Error("Unexpected URL"))
      })
    })

    it("should process successful sign-in response", async () => {
      const urlPath = "/auth/external/sign-in-callback?code=auth-code&state=test-state"

      const result = await facebookClient.processSignInResponse(signInState, urlPath)

      // Verify token exchange call
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("https://graph.facebook.com/v18.0/oauth/access_token"),
        expect.objectContaining({
          method: "GET",
          headers: { Accept: "application/json" },
        }),
      )

      // Verify profile fetch call
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("https://graph.facebook.com/v18.0/me"),
        expect.objectContaining({
          method: "GET",
          headers: { Accept: "application/json" },
        }),
      )

      expect(result).toEqual({
        idToken: "", // Facebook doesn't provide ID tokens
        refreshToken: undefined, // Facebook doesn't use refresh tokens
        accessToken: "mock-access-token",
        profile: {
          identifierClaimValue: "facebook-user-123",
          email: "test@example.com",
          givenName: "John",
          surname: "Doe",
        },
      })
    })

    it("should use custom identifier claim when configured", async () => {
      // Update identity provider to use custom identifier claim
      const customIdentityProvider = factories.createIdentityProvider({
        ...identityProvider,
        identifierClaimName: "custom_id",
      })
      const customFacebookClient = new FacebookClient(baseUrl, customIdentityProvider)

      mockUserProfile.custom_id = "custom-123"

      const customSignInState: SignInState = {
        ...signInState,
        identityProviderId: customIdentityProvider.id,
      }

      const urlPath = "/auth/external/sign-in-callback?code=auth-code&state=test-state"

      const result = await customFacebookClient.processSignInResponse(customSignInState, urlPath)

      expect(result.profile.identifierClaimValue).toBe("custom-123")
    })

    it("should fall back to id field when custom identifier claim is missing", async () => {
      // Update identity provider to use custom identifier claim that doesn't exist
      const customIdentityProvider = factories.createIdentityProvider({
        ...identityProvider,
        identifierClaimName: "nonexistent_field",
      })
      const customFacebookClient = new FacebookClient(baseUrl, customIdentityProvider)

      const customSignInState: SignInState = {
        ...signInState,
        identityProviderId: customIdentityProvider.id,
      }

      const urlPath = "/auth/external/sign-in-callback?code=auth-code&state=test-state"

      const result = await customFacebookClient.processSignInResponse(customSignInState, urlPath)

      expect(result.profile.identifierClaimValue).toBe("facebook-user-123") // Falls back to id
    })

    it("should throw error when Facebook returns OAuth error", async () => {
      const urlPath = "/auth/external/sign-in-callback?error=access_denied&error_description=User+denied+access"

      await expect(facebookClient.processSignInResponse(signInState, urlPath)).rejects.toThrow(AuthenticationError)

      await expect(facebookClient.processSignInResponse(signInState, urlPath)).rejects.toThrow(
        "Facebook OAuth error: access_denied",
      )
    })

    it("should throw error when authorization code is missing", async () => {
      const urlPath = "/auth/external/sign-in-callback?state=test-state"

      await expect(facebookClient.processSignInResponse(signInState, urlPath)).rejects.toThrow(AuthenticationError)

      await expect(facebookClient.processSignInResponse(signInState, urlPath)).rejects.toThrow(
        "Authorization code not received from Facebook",
      )
    })

    it("should throw error for invalid state", async () => {
      const urlPath = "/auth/external/sign-in-callback?code=auth-code&state=wrong-state"

      await expect(facebookClient.processSignInResponse(signInState, urlPath)).rejects.toThrow(AuthenticationError)

      await expect(facebookClient.processSignInResponse(signInState, urlPath)).rejects.toThrow(
        "Invalid state parameter",
      )
    })

    it("should throw error when token exchange fails", async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes("oauth/access_token")) {
          return Promise.resolve({
            ok: false,
            status: 400,
            statusText: "Bad Request",
          } as any)
        }
        return Promise.reject(new Error("Unexpected URL"))
      })

      const urlPath = "/auth/external/sign-in-callback?code=auth-code&state=test-state"

      await expect(facebookClient.processSignInResponse(signInState, urlPath)).rejects.toThrow(AuthenticationError)

      await expect(facebookClient.processSignInResponse(signInState, urlPath)).rejects.toThrow(
        "Token exchange failed: 400 Bad Request",
      )
    })

    it("should throw error when profile fetch fails", async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes("oauth/access_token")) {
          return Promise.resolve({
            ok: true,
            json: vi.fn().mockResolvedValue(mockTokenResponse),
          } as any)
        }
        if (url.includes("/me")) {
          return Promise.resolve({
            ok: false,
            status: 403,
            statusText: "Forbidden",
          } as any)
        }
        return Promise.reject(new Error("Unexpected URL"))
      })

      const urlPath = "/auth/external/sign-in-callback?code=auth-code&state=test-state"

      await expect(facebookClient.processSignInResponse(signInState, urlPath)).rejects.toThrow(AuthenticationError)

      await expect(facebookClient.processSignInResponse(signInState, urlPath)).rejects.toThrow(
        "Failed to fetch user profile: 403 Forbidden",
      )
    })

    it("should throw error when Facebook API returns error in profile response", async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes("oauth/access_token")) {
          return Promise.resolve({
            ok: true,
            json: vi.fn().mockResolvedValue(mockTokenResponse),
          } as any)
        }
        if (url.includes("/me")) {
          return Promise.resolve({
            ok: true,
            json: vi.fn().mockResolvedValue({
              error: {
                message: "Invalid access token",
                type: "OAuthException",
              },
            }),
          } as any)
        }
        return Promise.reject(new Error("Unexpected URL"))
      })

      const urlPath = "/auth/external/sign-in-callback?code=auth-code&state=test-state"

      await expect(facebookClient.processSignInResponse(signInState, urlPath)).rejects.toThrow(AuthenticationError)

      await expect(facebookClient.processSignInResponse(signInState, urlPath)).rejects.toThrow(
        "Facebook API error: Invalid access token",
      )
    })

    it("should throw error when required profile information is missing", async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes("oauth/access_token")) {
          return Promise.resolve({
            ok: true,
            json: vi.fn().mockResolvedValue(mockTokenResponse),
          } as any)
        }
        if (url.includes("/me")) {
          return Promise.resolve({
            ok: true,
            json: vi.fn().mockResolvedValue({
              id: "facebook-user-123",
              first_name: "John",
              last_name: "Doe",
              // missing email
            }),
          } as any)
        }
        return Promise.reject(new Error("Unexpected URL"))
      })

      const urlPath = "/auth/external/sign-in-callback?code=auth-code&state=test-state"

      await expect(facebookClient.processSignInResponse(signInState, urlPath)).rejects.toThrow(AuthenticationError)

      await expect(facebookClient.processSignInResponse(signInState, urlPath)).rejects.toThrow(
        "Required profile information not available from Facebook",
      )
    })

    it("should handle missing optional profile fields", async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes("oauth/access_token")) {
          return Promise.resolve({
            ok: true,
            json: vi.fn().mockResolvedValue(mockTokenResponse),
          } as any)
        }
        if (url.includes("/me")) {
          return Promise.resolve({
            ok: true,
            json: vi.fn().mockResolvedValue({
              id: "facebook-user-123",
              email: "test@example.com",
              // missing first_name and last_name
            }),
          } as any)
        }
        return Promise.reject(new Error("Unexpected URL"))
      })

      const urlPath = "/auth/external/sign-in-callback?code=auth-code&state=test-state"

      const result = await facebookClient.processSignInResponse(signInState, urlPath)

      expect(result.profile).toEqual({
        identifierClaimValue: "facebook-user-123",
        email: "test@example.com",
        givenName: "",
        surname: "",
      })
    })

    it("should include correct parameters in token exchange request", async () => {
      const urlPath = "/auth/external/sign-in-callback?code=auth-code&state=test-state"

      await facebookClient.processSignInResponse(signInState, urlPath)

      const tokenCall = mockFetch.mock.calls.find(call => call[0].includes("oauth/access_token"))
      expect(tokenCall).toBeDefined()
      expect(tokenCall![0]).toContain("client_id=facebook-client-id")
      expect(tokenCall![0]).toContain("client_secret=facebook-client-secret")
      expect(tokenCall![0]).toContain(
        "redirect_uri=https%3A%2F%2Fauth.example.com%2Fauth%2Fexternal%2Fsign-in-callback",
      )
      expect(tokenCall![0]).toContain("code=auth-code")
    })

    it("should include correct parameters in profile request", async () => {
      const urlPath = "/auth/external/sign-in-callback?code=auth-code&state=test-state"

      await facebookClient.processSignInResponse(signInState, urlPath)

      const profileCall = mockFetch.mock.calls.find(call => call[0].includes("/me"))
      expect(profileCall).toBeDefined()
      expect(profileCall![0]).toContain("access_token=mock-access-token")
      expect(profileCall![0]).toContain("fields=id%2Cemail%2Cfirst_name%2Clast_name")
    })
  })

  describe("createSignOutRequest", () => {
    it("should throw error as Facebook doesn't support sign-out", async () => {
      await expect(facebookClient.createSignOutRequest(redirectUrl)).rejects.toThrow(
        "The identity provider does not support single-sign-out.",
      )
    })
  })

  describe("checkSessionWithRefreshToken", () => {
    it("should throw error as Facebook doesn't support refresh tokens", async () => {
      await expect(facebookClient.checkSessionWithRefreshToken("refresh-token")).rejects.toThrow(
        "The identity provider does not support refresh tokens.",
      )
    })
  })

  describe("editProfile", () => {
    it("should throw error as Facebook doesn't support profile editing", async () => {
      await expect(facebookClient.editProfile("access-token", "John", "Doe")).rejects.toThrow(
        "The identity provider does not support editing profiles.",
      )
    })
  })

  describe("error handling", () => {
    it("should propagate fetch errors during token exchange", async () => {
      const signInState: SignInState = {
        state: "test-state",
        nonce: "test-nonce",
        codeVerifier: "test-code-verifier",
        redirectUrl,
        identityProviderId: identityProvider.id,
      }

      mockFetch.mockRejectedValue(new Error("Network error"))

      const urlPath = "/auth/external/sign-in-callback?code=auth-code&state=test-state"

      await expect(facebookClient.processSignInResponse(signInState, urlPath)).rejects.toThrow("Network error")
    })

    it("should propagate fetch errors during profile fetch", async () => {
      const signInState: SignInState = {
        state: "test-state",
        nonce: "test-nonce",
        codeVerifier: "test-code-verifier",
        redirectUrl,
        identityProviderId: identityProvider.id,
      }

      mockFetch.mockImplementation((url: string) => {
        if (url.includes("oauth/access_token")) {
          return Promise.resolve({
            ok: true,
            json: vi.fn().mockResolvedValue({ access_token: "token" }),
          } as any)
        }
        if (url.includes("/me")) {
          return Promise.reject(new Error("Network error"))
        }
        return Promise.reject(new Error("Unexpected URL"))
      })

      const urlPath = "/auth/external/sign-in-callback?code=auth-code&state=test-state"

      await expect(facebookClient.processSignInResponse(signInState, urlPath)).rejects.toThrow("Network error")
    })
  })
})
