import { expect } from "@jest/globals"
import request from "supertest"
import { getTestContext, TestContext } from "@test/integration/internal/support/TestContext"
import { IdentityProvider } from "~/domain/entities"

describe("[POST] /auth/external/sign-in", () => {
  let context: TestContext
  let identityProvider: IdentityProvider

  beforeAll(async () => {
    context = await getTestContext()
    identityProvider = await context.data.createIdentityProvider({})
  })

  it("should redirect to IDP and set state cookie", async () => {
    context.mock.authClientCreateSignInRequest(redirectUrl => ({
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
})
