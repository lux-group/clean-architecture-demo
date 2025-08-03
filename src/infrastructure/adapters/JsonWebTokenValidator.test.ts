import { generateKeyPairSync } from "node:crypto"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import jwt from "jsonwebtoken"
import { AuthenticationError, commonErrors } from "~/domain/errors"
import { IdentityProvider, IdentityProviderProps } from "~/domain/entities"
import { IdentityProviderRepository } from "~/domain/repositories"
import { JsonWebTokenValidator } from "./JsonWebTokenValidator"

// Mock global fetch for OIDC metadata and JWKS endpoints
global.fetch = vi.fn()

// Mock the jwks-rsa library
vi.mock("jwks-rsa")

describe("JsonWebTokenValidator", () => {
  let validator: JsonWebTokenValidator
  let mockIdentityProviderRepository: any
  let identityProvider: IdentityProvider
  let privateKey: string
  let publicKey: string
  
  const issuerUrl = "https://login.microsoftonline.com/tenant-id"
  const audience = "test-audience"
  const jwksUri = "https://login.microsoftonline.com/tenant-id/discovery/v2.0/keys"
  const keyId = "test-key-id"

  beforeAll(() => {
    // Generate a real RSA key pair for testing
    const { privateKey: priv, publicKey: pub } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" }
    })
    privateKey = priv
    publicKey = pub;
    
    // Store public key globally for the mock to access
    (global as any).__testPublicKey = publicKey
  })

  beforeEach(async () => {
    vi.clearAllMocks()

    // Set up the jwks-rsa mock
    const jwksRsa = vi.mocked(await import("jwks-rsa"))
    jwksRsa.JwksClient = vi.fn().mockImplementation(() => ({
      getSigningKey: vi.fn().mockImplementation((kid: string) => {
        return Promise.resolve({
          getPublicKey: () => (global as any).__testPublicKey || "invalid-key"
        })
      })
    }))

    // Mock the repository
    mockIdentityProviderRepository = {
      tryGetByIssuerUrlAndAudience: vi.fn(),
    } as any

    // Create identity provider
    const identityProviderProps: IdentityProviderProps = {
      id: "idp123",
      createdAt: new Date(),
      updatedAt: new Date(),
      name: "Test IDP",
      issuerUrl,
      audience,
      identifierClaimName: "sub",
      authSettings: null,
    }
    identityProvider = new IdentityProvider(identityProviderProps)

    validator = new JsonWebTokenValidator(mockIdentityProviderRepository)

    // Set up successful mocks by default
    setupSuccessfulMocks()
  })

  const setupSuccessfulMocks = () => {
    // Mock successful OIDC metadata fetch
    ((global.fetch as any)).mockImplementation((url: string) => {
      if (url.includes("/.well-known/openid-configuration")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ jwks_uri: jwksUri }),
        })
      }
      
      return Promise.reject(new Error("Unexpected URL"))
    })

    mockIdentityProviderRepository.tryGetByIssuerUrlAndAudience.mockResolvedValue(identityProvider)
  }

  const createToken = (payload: any, options: { keyId?: string, algorithm?: jwt.Algorithm } = {}) => {
    return jwt.sign(payload, privateKey, {
      algorithm: options.algorithm || "RS256",
      keyid: options.keyId || keyId,
      header: {
        typ: "JWT",
        alg: options.algorithm || "RS256",
        kid: options.keyId || keyId,
      }
    })
  }

  const createValidPayload = () => ({
    iss: issuerUrl,
    aud: audience,
    sub: "user123",
    email: "test@example.com",
    given_name: "John",
    family_name: "Doe",
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  })

  describe("decodeAndValidateToken", () => {
    it("should successfully validate a valid JWT token", async () => {
      const payload = createValidPayload()
      const token = createToken(payload)

      const result = await validator.decodeAndValidateToken(token)

      expect(result).toEqual({
        identityProvider,
        profile: {
          email: "test@example.com",
          givenName: "John",
          surname: "Doe",
          identifierClaimValue: "user123",
        },
      })

      expect(mockIdentityProviderRepository.tryGetByIssuerUrlAndAudience).toHaveBeenCalledWith(
        issuerUrl,
        audience
      )
    })

    it("should throw AuthenticationError when JWT is malformed", async () => {
      const malformedToken = "not.a.valid.jwt.token"

      await expect(validator.decodeAndValidateToken(malformedToken)).rejects.toThrow(
        new AuthenticationError(commonErrors.invalidJwt)
      )
    })

    it("should throw AuthenticationError when iss claim is missing", async () => {
      const payload = { ...createValidPayload(), iss: undefined }
      const token = createToken(payload)

      await expect(validator.decodeAndValidateToken(token)).rejects.toThrow(
        new AuthenticationError(commonErrors.invalidJwt)
      )
    })

    it("should throw AuthenticationError when aud claim is missing", async () => {
      const payload = { ...createValidPayload(), aud: undefined }
      const token = createToken(payload)

      await expect(validator.decodeAndValidateToken(token)).rejects.toThrow(
        new AuthenticationError(commonErrors.invalidJwt)
      )
    })

    it("should throw AuthenticationError when sub claim is missing", async () => {
      const payload = { ...createValidPayload(), sub: undefined }
      const token = createToken(payload)

      await expect(validator.decodeAndValidateToken(token)).rejects.toThrow(
        new AuthenticationError(commonErrors.invalidJwt)
      )
    })

    it("should throw AuthenticationError when identity provider is not found", async () => {
      mockIdentityProviderRepository.tryGetByIssuerUrlAndAudience.mockResolvedValue(undefined)
      
      const payload = createValidPayload()
      const token = createToken(payload)

      await expect(validator.decodeAndValidateToken(token)).rejects.toThrow(
        new AuthenticationError(`${issuerUrl} with audience ${audience} is not a trusted identity provider.`)
      )
    })

    it("should handle OIDC metadata fetch failure", async () => {
      ((global.fetch as any)).mockImplementation((url: string) => {
        if (url.includes("/.well-known/openid-configuration")) {
          return Promise.resolve({
            ok: false,
            status: 404,
          })
        }
        return Promise.reject(new Error("Unexpected URL"))
      })

      const payload = createValidPayload()
      const token = createToken(payload)

      await expect(validator.decodeAndValidateToken(token)).rejects.toThrow(
        new AuthenticationError("Unable to fetch JWKS document.")
      )
    })

    it("should handle JWKS document fetch failure", async () => {
      // Reset and reconfigure the jwks-rsa mock to throw an error
      vi.resetModules()
      const jwksRsa = await import("jwks-rsa")
      vi.mocked(jwksRsa.JwksClient).mockImplementation(() => ({
        getKeys: vi.fn(),
        getSigningKeys: vi.fn(),
        getSigningKey: vi.fn().mockRejectedValue(new Error("JWKS fetch failed"))
      }))

      const payload = createValidPayload()
      const token = createToken(payload)

      await expect(validator.decodeAndValidateToken(token)).rejects.toThrow(
        new AuthenticationError("Unable to fetch JWKS document.")
      )
    })

    it("should throw AuthenticationError when JWT signature is invalid", async () => {
      // Create a token with a different private key
      const { privateKey: wrongPrivateKey } = generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: { type: "spki", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" }
      })

      const payload = createValidPayload()
      const tokenWithWrongSignature = jwt.sign(payload, wrongPrivateKey, {
        algorithm: "RS256",
        keyid: keyId,
        header: {
          typ: "JWT",
          alg: "RS256",
          kid: keyId,
        }
      })

      await expect(validator.decodeAndValidateToken(tokenWithWrongSignature)).rejects.toThrow(
        new AuthenticationError(commonErrors.invalidJwt)
      )
    })

    it("should correctly extract profile information", async () => {
      const payload = {
        ...createValidPayload(),
        email: "custom@example.com",
        given_name: "Jane",
        family_name: "Smith",
        sub: "custom-sub",
      }
      const token = createToken(payload)

      const result = await validator.decodeAndValidateToken(token)

      expect(result.profile).toEqual({
        email: "custom@example.com",
        givenName: "Jane",
        surname: "Smith",
        identifierClaimValue: "custom-sub",
      })
    })

    it("should use custom identifier claim name from identity provider", async () => {
      const customClaimName = "custom_id"
      const customIdentifierValue = "custom-identifier-value"
      
      // Create identity provider with custom identifier claim name
      const customIdentityProviderProps: IdentityProviderProps = {
        id: "custom-idp",
        createdAt: new Date(),
        updatedAt: new Date(),
        name: "Custom IDP",
        issuerUrl,
        audience,
        identifierClaimName: customClaimName,
        authSettings: null,
      }
      const customIdentityProvider = new IdentityProvider(customIdentityProviderProps)

      mockIdentityProviderRepository.tryGetByIssuerUrlAndAudience.mockResolvedValue(customIdentityProvider)

      const payload = {
        ...createValidPayload(),
        [customClaimName]: customIdentifierValue,
      }
      const token = createToken(payload)

      const result = await validator.decodeAndValidateToken(token)

      expect(result.profile.identifierClaimValue).toBe(customIdentifierValue)
    })

    it("should handle missing optional profile claims gracefully", async () => {
      const minimalPayload = {
        iss: issuerUrl,
        aud: audience,
        sub: "user123",
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        // Missing email, given_name, family_name
      }
      const token = createToken(minimalPayload)

      const result = await validator.decodeAndValidateToken(token)

      expect(result.profile).toEqual({
        email: undefined,
        givenName: undefined,
        surname: undefined,
        identifierClaimValue: "user123",
      })
    })

    it("should handle expired tokens", async () => {
      const expiredPayload = {
        ...createValidPayload(),
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      }
      const token = createToken(expiredPayload)

      await expect(validator.decodeAndValidateToken(token)).rejects.toThrow(
        new AuthenticationError(commonErrors.invalidJwt)
      )
    })

    it("should validate token with different key IDs", async () => {
      // Test that different key IDs work (the mock will handle any kid)
      const differentKeyId = "different-key-id"
      const payload = createValidPayload()
      const token = jwt.sign(payload, privateKey, {
        algorithm: "RS256",
        keyid: differentKeyId,
        header: {
          typ: "JWT",
          alg: "RS256",
          kid: differentKeyId,
        }
      })

      const result = await validator.decodeAndValidateToken(token)
      
      expect(result.identityProvider).toBe(identityProvider)
      expect(result.profile.identifierClaimValue).toBe("user123")
    })
  })
})



