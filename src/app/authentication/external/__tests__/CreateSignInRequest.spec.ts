import "@test/matchers/supertest"
import request from "supertest"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { mockAuthClient } from "@test/mocks"
import { getTestContext, TestContext } from "@test/integration/TestContext"
import { IdentityProvider } from "~/domain/entities"

describe("[POST] /auth/external/sign-in", () => {
  let context: TestContext
  let identityProvider: IdentityProvider

  beforeAll(async () => {
    context = getTestContext()
    identityProvider = await context.data.createIdentityProvider()
  })

  beforeEach(() => {
    const authClientFactory = context.container.resolve("authClientFactory")
    vi.spyOn(authClientFactory, "createClient").mockReturnValue(mockAuthClient)
    vi.clearAllMocks()
  })

  it("should redirect to IDP and set state cookie", async () => {
    mockAuthClient.createSignInRequest = vi.fn().mockImplementation(redirectUrl => Promise.resolve({
      url: "https://custom.provider.com/auth",
      signInState: {
        state: "unused",
        nonce: "unused", 
        codeVerifier: "unused",
        identityProviderId: "unused",
        redirectUrl,
      }
    }))

    const response = await request(context.server)
      .get(`/auth/external/sign-in?redirect_uri=${identityProvider.authSettings?.redirectUrls[0]}&provider=${identityProvider.name}`)
      .send()

    expect(response).toHaveStatus(302)
    expect(response).toHaveCookie("auth-state", ["HttpOnly", "Secure"])
    expect(response.headers.location).toBe("https://custom.provider.com/auth")
  })

  it("should return 400 when redirect_uri is not allowed", async () => {
    const response = await request(context.server)
      .get(`/auth/external/sign-in?redirect_uri=https://host.com/not-allowed&provider=${identityProvider.name}`)
      .send()

    expect(response).toHaveStatus(400)
  })

  it("should return 400 when provider does not exist", async () => {
    const response = await request(context.server)
      .get(`/auth/external/sign-in?redirect_uri=${identityProvider.authSettings?.redirectUrls[0]}&provider=invalid`)
      .send()

    expect(response).toHaveStatus(400)
  })

  // More scenarios can be added here:
  // - Missing redirect_uri
  // - Missing provider
  // - Provider has not auth settings
})

