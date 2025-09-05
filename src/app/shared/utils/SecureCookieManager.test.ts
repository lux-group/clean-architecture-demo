import { beforeEach, describe, expect, it, vi } from "vitest"
import { Request, Response } from "express"
import { NodeEncryptionProvider } from "~/infrastructure/crypto/NodeEncryptionProvider"
import { Session } from "~/domain/entities"
import { AuthenticationError, commonErrors } from "~/domain/errors"
import { SecureCookieManager } from "./SecureCookieManager"

type TestState = {
  test: string
}

describe("SecureCookieManager", () => {
  const validKey = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
  let encryptionProvider: NodeEncryptionProvider
  let cookieManager: SecureCookieManager
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>

  beforeEach(() => {
    encryptionProvider = new NodeEncryptionProvider([validKey])
    cookieManager = new SecureCookieManager(encryptionProvider)

    // Mock request with basic headers for fingerprinting
    mockRequest = {
      headers: {
        "accept-language": "en-US,en;q=0.9",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      cookies: {},
    }

    // Mock response with cookie methods
    const cookies: Record<string, any> = {}
    mockResponse = {
      cookie: vi.fn().mockImplementation((name: string, value: any, _options: any) => {
        cookies[name] = value
        mockRequest.cookies![name] = value
        return mockResponse as Response
      }),
      clearCookie: vi.fn().mockImplementation((name: string) => {
        delete cookies[name]
        delete mockRequest.cookies![name]
        return mockResponse as Response
      }),
    }
  })

  describe("setStateCookie and getStateCookie", () => {
    it("should set and retrieve state cookie successfully", () => {
      const state = { redirectUrl: "/dashboard", nonce: "test-nonce" }

      cookieManager.setStateCookie(mockRequest as Request, mockResponse as Response, state)

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        "auth-state",
        expect.any(String),
        expect.objectContaining({
          secure: true,
          httpOnly: true,
          sameSite: "lax",
          expires: undefined,
        }),
      )

      const retrievedState = cookieManager.getStateCookie<typeof state>(mockRequest as Request, mockResponse as Response)

      expect(retrievedState.redirectUrl).toBe(state.redirectUrl)
      expect(retrievedState.nonce).toBe(state.nonce)
    })

    it("should throw AuthenticationError when state cookie not found", () => {
      expect(() => {
        cookieManager.getStateCookie(mockRequest as Request, mockResponse as Response)
      }).toThrow(new AuthenticationError(commonErrors.cookieNotFound))
    })

    it("should throw AuthenticationError and clear cookie when state cookie is invalid", () => {
      mockRequest.cookies!["auth-state"] = "invalid-encrypted-data"

      expect(() => {
        cookieManager.getStateCookie(mockRequest as Request, mockResponse as Response)
      }).toThrow(new AuthenticationError(commonErrors.cookieInvalid))

      expect(mockResponse.clearCookie).toHaveBeenCalledWith("auth-state")
    })

    it("should throw AuthenticationError when device fingerprint doesn't match", () => {
      const state = { redirectUrl: "/dashboard" }

      // Set cookie with one user agent
      cookieManager.setStateCookie(mockRequest as Request, mockResponse as Response, state)

      // Change user agent to simulate different device
      mockRequest.headers!["user-agent"] = "Different Browser"

      expect(() => {
        cookieManager.getStateCookie(mockRequest as Request, mockResponse as Response)
      }).toThrow(new AuthenticationError(commonErrors.cookieInvalid))

      expect(mockResponse.clearCookie).toHaveBeenCalledWith("auth-state")
    })
  })

  describe("getAndRemoveStateCookie", () => {
    it("should retrieve and remove state cookie", () => {
      const state = { redirectUrl: "/dashboard" }

      cookieManager.setStateCookie(mockRequest as Request, mockResponse as Response, state)

      const retrievedState = cookieManager.getAndRemoveStateCookie<typeof state>(mockRequest as Request, mockResponse as Response)

      expect(retrievedState.redirectUrl).toBe(state.redirectUrl)
      expect(mockResponse.clearCookie).toHaveBeenCalledWith("auth-state")
    })
  })

  describe("setSessionCookie and getSessionCookie", () => {
    let session: Session

    beforeEach(() => {
      session = Session.createNew(
        {
          userId: "f32a9a37-4fa0-4fdc-b294-4812137f4083",
          identityProviderId: null,
          identityProviderSessionId: null,
          idToken: null,
          refreshToken: null,
        },
        24,
      ) // 24 hours
    })

    it("should set and retrieve session cookie successfully", () => {
      cookieManager.setSessionCookie(mockRequest as Request, mockResponse as Response, session)

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        "auth-session",
        expect.any(String),
        expect.objectContaining({
          secure: true,
          httpOnly: true,
          sameSite: "strict",
          expires: session.expiresAt,
        }),
      )

      const retrievedSessionCookie = cookieManager.getSessionCookie(mockRequest as Request, mockResponse as Response)

      expect(retrievedSessionCookie.id).toBe(session.id)
      expect(retrievedSessionCookie.nonce).toBe(session.nonce)
    })

    it("should throw AuthenticationError when session cookie not found", () => {
      expect(() => {
        cookieManager.getSessionCookie(mockRequest as Request, mockResponse as Response)
      }).toThrow(new AuthenticationError(commonErrors.cookieNotFound))
    })

    it("should throw AuthenticationError and clear cookie when session cookie is invalid", () => {
      mockRequest.cookies!["auth-session"] = "invalid-encrypted-data"

      expect(() => {
        cookieManager.getSessionCookie(mockRequest as Request, mockResponse as Response)
      }).toThrow(new AuthenticationError(commonErrors.cookieInvalid))

      expect(mockResponse.clearCookie).toHaveBeenCalledWith("auth-session")
    })

    it("should throw AuthenticationError when device fingerprint doesn't match for session cookie", () => {
      // Set cookie with one user agent
      cookieManager.setSessionCookie(mockRequest as Request, mockResponse as Response, session)

      // Change user agent to simulate different device
      mockRequest.headers!["user-agent"] = "Different Browser"

      expect(() => {
        cookieManager.getSessionCookie(mockRequest as Request, mockResponse as Response)
      }).toThrow(new AuthenticationError(commonErrors.cookieInvalid))

      expect(mockResponse.clearCookie).toHaveBeenCalledWith("auth-session")
    })
  })

  describe("getAndRemoveSessionCookie", () => {
    it("should retrieve and remove session cookie", () => {
      const session = Session.createNew(
        {
          userId: "f32a9a37-4fa0-4fdc-b294-4812137f4083",
          identityProviderId: null,
          identityProviderSessionId: null,
          idToken: null,
          refreshToken: null,
        },
        24,
      )

      cookieManager.setSessionCookie(mockRequest as Request, mockResponse as Response, session)

      const retrievedSessionCookie = cookieManager.getAndRemoveSessionCookie(mockRequest as Request, mockResponse as Response)

      expect(retrievedSessionCookie.id).toBe(session.id)
      expect(retrievedSessionCookie.nonce).toBe(session.nonce)
      expect(mockResponse.clearCookie).toHaveBeenCalledWith("auth-session")
    })
  })

  describe("removeSessionCookie", () => {
    it("should remove session cookie", () => {
      cookieManager.removeSessionCookie(mockResponse as Response)

      expect(mockResponse.clearCookie).toHaveBeenCalledWith("auth-session")
    })
  })

  describe("cookie options and security", () => {
    it("should set state cookie with lax sameSite for redirects", () => {
      const state = { redirectUrl: "/dashboard" }

      cookieManager.setStateCookie(mockRequest as Request, mockResponse as Response, state)

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        "auth-state",
        expect.any(String),
        expect.objectContaining({
          secure: true,
          httpOnly: true,
          sameSite: "lax",
          expires: undefined,
        }),
      )
    })

    it("should set session cookie with strict sameSite for security", () => {
      const session = Session.createNew(
        {
          userId: "f32a9a37-4fa0-4fdc-b294-4812137f4083",
          identityProviderId: null,
          identityProviderSessionId: null,
          idToken: null,
          refreshToken: null,
        },
        24,
      )

      cookieManager.setSessionCookie(mockRequest as Request, mockResponse as Response, session)

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        "auth-session",
        expect.any(String),
        expect.objectContaining({
          secure: true,
          httpOnly: true,
          sameSite: "strict",
          expires: session.expiresAt,
        }),
      )
    })

    it("should include device fingerprint in cookie payload", () => {
      const state = { test: "data" }
      let encryptedValue: string

      // Capture the encrypted value
      const mockCookie = vi.fn().mockImplementation((name: string, value: string) => {
        encryptedValue = value
        mockRequest.cookies![name] = value
        return mockResponse as Response
      })
      mockResponse.cookie = mockCookie

      cookieManager.setStateCookie(mockRequest as Request, mockResponse as Response, state)

      // Decrypt and verify the payload includes device fingerprint
      const decryptedJson = encryptionProvider.decrypt(encryptedValue!)
      const payload = JSON.parse(decryptedJson)

      expect(payload.test).toBe("data")
      expect(payload.device).toBeDefined()
      expect(typeof payload.device).toBe("string")
      expect(payload.device.length).toBeGreaterThan(0)
    })
  })

  describe("device fingerprinting", () => {
    it("should handle missing headers gracefully", () => {
      const requestWithoutHeaders: Partial<Request> = {
        headers: {},
        cookies: {},
      }

      const responseForMissingHeaders: Partial<Response> = {
        cookie: vi.fn().mockImplementation((name: string, value: any, _options: any) => {
          requestWithoutHeaders.cookies![name] = value
          return responseForMissingHeaders as Response
        }),
        clearCookie: vi.fn().mockImplementation((name: string) => {
          delete requestWithoutHeaders.cookies![name]
          return responseForMissingHeaders as Response
        }),
      }

      const state: TestState = { test: "data" }

      cookieManager.setStateCookie(requestWithoutHeaders as Request, responseForMissingHeaders as Response, state)
      const retrieved = cookieManager.getStateCookie<TestState>(requestWithoutHeaders as Request, responseForMissingHeaders as Response)

      expect(retrieved.test).toBe("data")
    })

    it("should normalize user agent by removing version numbers", () => {
      const state: TestState = { test: "data" }

      // Set cookie with detailed user agent including versions
      mockRequest.headers!["user-agent"] =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      cookieManager.setStateCookie(mockRequest as Request, mockResponse as Response, state)

      // Change to different version numbers but same browser
      mockRequest.headers!["user-agent"] =
        "Mozilla/6.0 (Windows NT 10.0; Win64; x64) AppleWebKit/538.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/538.36"

      // Should still work because version numbers are stripped
      const retrieved = cookieManager.getStateCookie<TestState>(mockRequest as Request, mockResponse as Response)
      expect(retrieved.test).toBe("data")
    })
  })

  describe("encryption integration", () => {
    it("should work with multiple encryption keys", () => {
      const multiKeyProvider = new NodeEncryptionProvider(["fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210", validKey])
      const multiKeyCookieManager = new SecureCookieManager(multiKeyProvider)

      const state: TestState = { test: "data" }

      multiKeyCookieManager.setStateCookie(mockRequest as Request, mockResponse as Response, state)
      const retrieved = multiKeyCookieManager.getStateCookie<TestState>(mockRequest as Request, mockResponse as Response)

      expect(retrieved.test).toBe("data")
    })
  })
})
