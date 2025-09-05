import * as factories from "@test/factories"
import { mockAuthClient } from "@test/mocks"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { IdentityProviderType } from "~/domain/entities"
import { InvalidOperationError } from "~/domain/errors"
import { AppleClient } from "./AppleClient"
import { ClientFactory } from "./ClientFactory"
import { FacebookClient } from "./FacebookClient"
import { OidcClient } from "./OidcClient"

vi.mock("./OidcClient")
vi.mock("./FacebookClient")
vi.mock("./AppleClient")

const MockOidcClient = vi.mocked(OidcClient)
const MockFacebookClient = vi.mocked(FacebookClient)
const MockAppleClient = vi.mocked(AppleClient)

describe("ClientFactory", () => {
  let clientFactory: ClientFactory
  const baseUrl = "https://auth.example.com"

  beforeEach(() => {
    vi.clearAllMocks()
    clientFactory = new ClientFactory(baseUrl)
  })

  describe("createClient", () => {
    it("should create OidcClient for Entra identity provider", () => {
      const identityProvider = factories.createIdentityProvider({
        authSettings: {
          type: IdentityProviderType.Entra,
        },
      })

      MockOidcClient.mockImplementation(() => mockAuthClient as unknown as OidcClient)

      const result = clientFactory.createClient(identityProvider)

      expect(MockOidcClient).toHaveBeenCalledWith(baseUrl, identityProvider, true)
      expect(result).toBe(mockAuthClient)
    })

    it("should create OidcClient for Google identity provider", () => {
      const identityProvider = factories.createIdentityProvider({
        authSettings: {
          type: IdentityProviderType.Google,
        },
      })

      MockOidcClient.mockImplementation(() => mockAuthClient as unknown as OidcClient)

      const result = clientFactory.createClient(identityProvider)

      expect(MockOidcClient).toHaveBeenCalledWith(baseUrl, identityProvider, false)
      expect(result).toBe(mockAuthClient)
    })

    it("should create AppleClient for Apple identity provider", () => {
      const identityProvider = factories.createIdentityProvider({
        authSettings: {
          type: IdentityProviderType.Apple,
        },
      })

      MockAppleClient.mockImplementation(() => mockAuthClient as unknown as AppleClient)

      const result = clientFactory.createClient(identityProvider)

      expect(MockAppleClient).toHaveBeenCalledWith(baseUrl, identityProvider)
      expect(result).toBe(mockAuthClient)
    })

    it("should create FacebookClient for Facebook identity provider", () => {
      const identityProvider = factories.createIdentityProvider({
        authSettings: {
          type: IdentityProviderType.Facebook,
        },
      })

      MockFacebookClient.mockImplementation(() => mockAuthClient as unknown as FacebookClient)

      const result = clientFactory.createClient(identityProvider)

      expect(MockFacebookClient).toHaveBeenCalledWith(baseUrl, identityProvider)
      expect(result).toBe(mockAuthClient)
    })

    it("should throw InvalidOperationError when identity provider has no authSettings", () => {
      const identityProvider = factories.createIdentityProvider({
        authSettings: null,
      })

      expect(() => clientFactory.createClient(identityProvider)).toThrow(InvalidOperationError)
      expect(() => clientFactory.createClient(identityProvider)).toThrow(
        "The identity provider is not configured for authentication.",
      )
    })
  })
})
