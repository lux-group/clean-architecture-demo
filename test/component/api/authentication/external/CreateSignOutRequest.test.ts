import { expect } from "@jest/globals"
import request from "supertest"
import { getTestContext, TestContext } from "@test/component/support/TestContext"
import { IdentityProvider, SessionStatus } from "~/domain/entities"

describe("[POST] /auth/external/sign-out", () => {
  let context: TestContext
  let identityProvider: IdentityProvider

  beforeAll(async () => {
    context = await getTestContext()
    identityProvider = await context.data.createIdentityProvider({})
  })

  it("should redirect to IDP and set state cookie", async () => {
    context.mock.authClientCreateSignOutRequest(redirectUrl => ({
      url: "https://custom.provider.com/auth",
      signOutState: {
        redirectUrl,
        identityProviderId: "unused",
      }
    }))

    const user = await context.data.createUser({})
    let session = await context.data.createSession({ userId: user.id, identityProviderId: identityProvider.id }, 1)
    const cookie = context.data.createAuthSessionCookie(session)

    const response = await request(context.server)
      .get(`/auth/external/sign-out?redirect_uri=${identityProvider.authSettings?.redirectUrls[0]}`)
      .set("Cookie", [`auth-session=${cookie}`])
      .send()

    expect(response).toHaveStatus(302)
    expect(response).toHaveCookie("auth-state", ["HttpOnly", "Secure"])
    expect(response.headers.location).toBe("https://custom.provider.com/auth")

    session = await context.data.getSession(session.id)
    expect(session.status).toBe(SessionStatus.TerminatedByUser)
  })
})
