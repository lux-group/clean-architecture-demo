import { expect } from "@jest/globals"
import request from "supertest"
import { getTestContext, TestContext } from "@test/component/support/TestContext"
import { IdentityProvider } from "~/domain/entities"

describe("[POST] /auth/external/sign-out-callback", () => {
  let context: TestContext
  let identityProvider: IdentityProvider

  beforeAll(async () => {
    context = await getTestContext()
    identityProvider = await context.data.createIdentityProvider({})
  })

  it("should handle custom sign-in URL", async () => {
    const cookie = context.data.createAuthStateCookie(identityProvider.authSettings!.redirectUrls[0], identityProvider.id)

    const response = await request(context.server)
      .get("/auth/external/sign-out-callback")
      .set("Cookie", [`auth-state=${cookie}`])
      .send()

    expect(response).toHaveStatus(302)
    expect(response.headers.location).toBe(identityProvider.authSettings!.redirectUrls[0])
  })
})
