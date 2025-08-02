import request from "supertest"
import { expect } from "@jest/globals"
import { mockAuthClient } from "@test/support/mocks"
import { getTestContext, TestContext } from "@test/support/TestContext"
import { IdentityProvider, SessionStatus } from "~/domain/entities"

describe("[POST] /auth/external/sign-out", () => {
  let context: TestContext
  let identityProvider: IdentityProvider

  beforeAll(async () => {
    context = await getTestContext()
    identityProvider = await context.data.createIdentityProvider()
  })

  beforeEach(() => {
    const authClientFactory = context.container.resolve("authClientFactory")
    jest.spyOn(authClientFactory, "createClient").mockReturnValue(mockAuthClient)
    jest.clearAllMocks()
  })

  it("should redirect to IDP and set state cookie", async () => {
    mockAuthClient.createSignOutRequest = jest.fn().mockImplementation(redirectUrl => Promise.resolve({
      url: "https://custom.provider.com/auth",
      signOutState: {
        redirectUrl,
        identityProviderId: "unused",
      }
    }))

    const user = await context.data.createUser()
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

  it("should return 400 when redirect_uri is not allowed", async () => {
    const user = await context.data.createUser()
    let session = await context.data.createSession({ userId: user.id, identityProviderId: identityProvider.id }, 1)
    const cookie = context.data.createAuthSessionCookie(session)

    const response = await request(context.server)
      .get("/auth/external/sign-out?redirect_uri=https://host.com/not-allowed")
      .set("Cookie", [`auth-session=${cookie}`])
      .send()

    expect(response).toHaveStatus(400)
  })

  it("should return 401 when session cookie is missing", async () => {
    const response = await request(context.server)
      .get(`/auth/external/sign-out?redirect_uri=${identityProvider.authSettings?.redirectUrls[0]}`)
      .send()

    expect(response).toHaveStatus(401)
  })

  // Additional scenarios can be added here:
  // - Missing redirect URL
  // - Session already terminated
})
