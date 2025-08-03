import { fail } from "node:assert"
import { InvalidOperationError, ValidationError, commonErrors } from "~/domain/errors"
import { IdentityProvider, IdentityProviderType, CreateIdentityProviderProps, UpdateIdentityProviderProps } from "./IdentityProvider"

describe("IdentityProvider", () => {
  const mockCreateProps: CreateIdentityProviderProps = {
    name: "Test Provider",
    issuerUrl: "https://test.example.com",
    audience: "test-audience",
    identifierClaimName: "sub",
    authSettings: {
      type: IdentityProviderType.Google,
      brand: "test-brand",
      clientId: "test-client-id",
      clientSecret: "test-client-secret",
      redirectUrls: ["https://app.example.com/callback", "https://app.example.com/auth"],
      autoLinkUsers: true,
      autoCreateUsers: false,
    },
  }

  const mockPropsWithoutAuth: CreateIdentityProviderProps = {
    name: "No Auth Provider",
    issuerUrl: "https://noauth.example.com",
    audience: "noauth-audience",
    identifierClaimName: "email",
    authSettings: null,
  }

  describe("createNew", () => {
    it("should create a new IdentityProvider with generated id and timestamps", () => {
      const identityProvider = IdentityProvider.createNew(mockCreateProps)

      expect(identityProvider.id).toBeDefined()
      expect(identityProvider.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      expect(identityProvider.createdAt).toBeInstanceOf(Date)
      expect(identityProvider.updatedAt).toBeInstanceOf(Date)
      expect(identityProvider.name).toBe(mockCreateProps.name)
      expect(identityProvider.issuerUrl).toBe(mockCreateProps.issuerUrl)
      expect(identityProvider.audience).toBe(mockCreateProps.audience)
      expect(identityProvider.identifierClaimName).toBe(mockCreateProps.identifierClaimName)
      expect(identityProvider.authSettings).toEqual(mockCreateProps.authSettings)
    })

    it("should create IdentityProvider without auth settings", () => {
      const identityProvider = IdentityProvider.createNew(mockPropsWithoutAuth)

      expect(identityProvider.authSettings).toBeNull()
      expect(identityProvider.name).toBe(mockPropsWithoutAuth.name)
    })

    it.each([
      { path: "name", value: null, error: "expected string" },
      { path: "name", value: "", error: "5 characters" },
      { path: "name", value: "a".repeat(51), error: "50 characters" },
      { path: "issuerUrl", value: null, error: "expected string" },
      { path: "issuerUrl", value: "", error: "Invalid URL" },
      { path: "issuerUrl", value: "not-a-url", error: "Invalid URL" },
      { path: "issuerUrl", value: "http://", error: "Invalid URL" },
      { path: "audience", value: null, error: "expected string" },
      { path: "audience", value: "short", error: "10 characters" },
      { path: "audience", value: "a".repeat(101), error: "100 characters" },
      { path: "identifierClaimName", value: null, error: "expected string" },
      { path: "identifierClaimName", value: "ab", error: "3 characters" },
      { path: "identifierClaimName", value: "a".repeat(21), error: "20 characters" },
      { path: "authSettings.type", value: "INVALID", error: "expected one of" },
      { path: "authSettings.type", value: null, error: "expected one of" },
      { path: "authSettings.brand", value: "", error: "5 characters" },
      { path: "authSettings.brand", value: null, error: "expected string" },
      { path: "authSettings.clientId", value: "short", error: "10 characters" },
      { path: "authSettings.clientId", value: "a".repeat(101), error: "100 characters" },
      { path: "authSettings.clientSecret", value: "short", error: "10 characters" },
      { path: "authSettings.clientSecret", value: "a".repeat(101), error: "100 characters" },
      { path: "authSettings.redirectUrls", value: [], error: "1 items" },
      { path: "authSettings.redirectUrls", value: ["not-a-url"], error: "Invalid URL" },
      { path: "authSettings.redirectUrls", value: [123], error: "expected string" },
    ])("should throw a validation error when $path is $value", async ({ path, value, error }) => {
      try {
        if (path.includes(".")) {
          const [ parent, child ] = path.split(".")
          path = parent
          value = { ...mockCreateProps[parent], [child]: value } as any
        }

        IdentityProvider.createNew({ ...mockCreateProps, [path]: value })
        fail("Expected validation error to be thrown")
      } catch (thrownError: ValidationError | any) {
        expect(thrownError.errors).toBeDefined()
        expect(thrownError.errors[0].path).toContain(path)
        expect(thrownError.errors[0].message).toContain(error)
      }
    })
  })

  describe("update", () => {
    it("should update properties and set new updatedAt timestamp", () => {
      const identityProvider = IdentityProvider.createNew(mockCreateProps)
      const originalUpdatedAt = identityProvider.updatedAt

      const updateProps: UpdateIdentityProviderProps = {
        name: "Updated Provider",
        issuerUrl: "https://updated.example.com",
        audience: "updated-audience",
        identifierClaimName: "email",
        authSettings: {
          type: IdentityProviderType.Entra,
          brand: "updated-brand",
          clientId: "updated-client-id",
          clientSecret: "updated-client-secret",
          redirectUrls: ["https://app.example.com/new-callback"],
          autoLinkUsers: false,
          autoCreateUsers: true,
        },
      }

      identityProvider.update(updateProps)

      expect(identityProvider.name).toBe(updateProps.name)
      expect(identityProvider.issuerUrl).toBe(updateProps.issuerUrl)
      expect(identityProvider.audience).toBe(updateProps.audience)
      expect(identityProvider.identifierClaimName).toBe(updateProps.identifierClaimName)
      expect(identityProvider.authSettings).toEqual(updateProps.authSettings)
      expect(identityProvider.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime())
    })
  })

  describe("verifyRedirectUrl", () => {
    it("should pass validation for valid redirect URL", () => {
      const identityProvider = IdentityProvider.createNew(mockCreateProps)

      expect(() => {
        identityProvider.verifyRedirectUrl("https://app.example.com/callback/oauth")
      }).not.toThrow()

      expect(() => {
        identityProvider.verifyRedirectUrl("https://app.example.com/auth/complete")
      }).not.toThrow()
    })

    it("should throw InvalidOperationError when auth settings are missing", () => {
      const identityProvider = IdentityProvider.createNew(mockPropsWithoutAuth)

      expect(() => {
        identityProvider.verifyRedirectUrl("https://app.example.com/callback")
      }).toThrow(InvalidOperationError)

      expect(() => {
        identityProvider.verifyRedirectUrl("https://app.example.com/callback")
      }).toThrow(commonErrors.missingAuthSettings)
    })

    it("should throw InvalidOperationError for invalid redirect URL", () => {
      const identityProvider = IdentityProvider.createNew(mockCreateProps)

      expect(() => {
        identityProvider.verifyRedirectUrl("https://malicious.example.com/callback")
      }).toThrow(InvalidOperationError)

      expect(() => {
        identityProvider.verifyRedirectUrl("https://malicious.example.com/callback")
      }).toThrow(commonErrors.invalidRedirectUrl)
    })

    it("should throw InvalidOperationError for URL that doesn't start with allowed URL", () => {
      const identityProvider = IdentityProvider.createNew(mockCreateProps)

      expect(() => {
        identityProvider.verifyRedirectUrl("https://app.example.co/callback") // .co instead of .com
      }).toThrow(InvalidOperationError)

      expect(() => {
        identityProvider.verifyRedirectUrl("http://app.example.com/callback") // http instead of https
      }).toThrow(InvalidOperationError)
    })
  })
})

