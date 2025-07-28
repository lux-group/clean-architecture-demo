import { randomUUID } from "crypto"
import { expect } from "@jest/globals"
import request from "supertest"
import { getTestContext, TestContext } from "@test/integration/internal/support/TestContext"
import { IdentityProvider } from "~/domain/entities"

describe("[POST] /auth/external/sign-in-callback", () => {
  let context: TestContext
  let identityProvider: IdentityProvider

  beforeAll(async () => {
    context = await getTestContext()
    identityProvider = await context.data.createIdentityProvider({})
  })

  it("should handle custom sign-in URL", async () => {
    context.mock.authClientProcessSignInResponse(() => ({
      idToken: "unused",
      refreshToken: "unused",
      accessToken: "unused",
      sessionId: randomUUID(),
      profile: {
        identifierClaimValue: randomUUID(),
        email: `${randomUUID()}@example.com`,
        givenName: randomUUID(),
        surname: randomUUID(),
      }
    }))

    const cookie = context.data.createAuthStateCookie(identityProvider.authSettings!.redirectUrls[0], identityProvider.id)

    const response = await request(context.server)
      .get("/auth/external/sign-in-callback")
      .set("Cookie", [`auth-state=${cookie}`])
      .send()

    expect(response).toHaveStatus(302)
    expect(response).toHaveCookie("auth-session", ["HttpOnly", "Secure", "SameSite=Strict"])
    expect(response.headers.location).toBe(identityProvider.authSettings?.redirectUrls[0])
  })

  // More scenarios can be added here:
  // - User exists and linked to identity provider
  // - User exists but not linked to identity provider
  // - User disabled
  // - Invalid state
  // - Invalid session
  // - Missing session
})
