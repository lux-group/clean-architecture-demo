import { beforeEach, describe, expect, it, vi } from "vitest"
import * as factories from "@test/factories"
import { mockAuthClient } from "@test/mocks"
import { IdentityProviderType } from "~/domain/entities"
import { ClientFactory } from "./ClientFactory"
import { OidcClient } from "./OidcClient"
import { FacebookClient } from "./FacebookClient"
import { AppleClient } from "./AppleClient"

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
          brand: "microsoft",
          clientId: "entra-client-id",
          clientSecret: "entra-client-secret",
          redirectUrls: ["https://auth.example.com/callback"],
          autoLinkUsers: false,
          autoCreateUsers: true,
        }
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
          brand: "google",
          clientId: "google-client-id",
          clientSecret: "google-client-secret",
          redirectUrls: ["https://auth.example.com/callback"],
          autoLinkUsers: false,
          autoCreateUsers: true,
        }
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
          brand: "apple",
          clientId: "apple-client-id",
          clientSecret: "apple-client-secret",
          redirectUrls: ["https://auth.example.com/callback"],
          autoLinkUsers: false,
          autoCreateUsers: true,
        }
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
          brand: "facebook",
          clientId: "facebook-client-id",
          clientSecret: "facebook-client-secret",
          redirectUrls: ["https://auth.example.com/callback"],
          autoLinkUsers: false,
          autoCreateUsers: true,
        }
      })

      MockFacebookClient.mockImplementation(() => mockAuthClient as unknown as FacebookClient)

      const result = clientFactory.createClient(identityProvider)

      expect(MockFacebookClient).toHaveBeenCalledWith(baseUrl, identityProvider)
      expect(result).toBe(mockAuthClient)
    })
  })
})