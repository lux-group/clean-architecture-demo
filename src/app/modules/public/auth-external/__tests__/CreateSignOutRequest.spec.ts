import { getTestContext, TestContext } from "@test/integration/TestContext"
import { mockAuthClient } from "@test/mocks"
import request from "supertest"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { IdentityProvider, SessionStatus } from "~/domain/entities"

describe("[POST] /auth/v2/external/sign-out (CreateSignOutRequest)", () => {
  let context: TestContext
  let idp: IdentityProvider

  beforeAll(async () => {
    context = await getTestContext()
    idp = await context.data.createIdentityProvider()
  })

  beforeEach(() => {
    const authClientFactory = context.container.resolve("authClientFactory")
    vi.spyOn(authClientFactory, "createClient").mockReturnValue(mockAuthClient)
    vi.clearAllMocks()
  })

  describe("when the request is valid", () => {
    it("should redirect to IDP and set state cookie", async () => {
      mockAuthClient.createSignOutRequest = vi.fn().mockImplementation(redirectUrl =>
        Promise.resolve({
          url: "https://custom.provider.com/auth",
          signOutState: {
            redirectUrl,
            identityProviderId: "unused",
          },
        }),
      )

      const user = await context.data.createUser()
      let session = await context.data.createSession({ userId: user.id, identityProviderId: idp.id }, 1)
      const cookie = context.data.createAuthSessionCookie(session)

      const response = await request(context.server)
        .get(`/auth/v2/external/sign-out?redirect_uri=${idp.authSettings?.redirectUrls[0]}`)
        .set("Cookie", [`auth-session=${cookie}`])
        .send()

      expect(response.status).toBe(302)
      expect(response.headers.location).toBe("https://custom.provider.com/auth")
      expect(response.headers["set-cookie"]).toEqual(
        expect.arrayContaining([expect.stringMatching(/auth-state=.*HttpOnly; Secure;/)]),
      )

      session = await context.data.getSession(session.id)
      expect(session.status).toBe(SessionStatus.TerminatedByUser)
    })
  })

  describe("when the user does not have an active session", () => {
    it("should return 401", async () => {
      const response = await request(context.server)
        .get(`/auth/v2/external/sign-out?redirect_uri=${idp.authSettings?.redirectUrls[0]}`)
        .send()

      expect(response.status).toBe(401)
    })
  })

  describe("when redirect_uri is missing", () => {
    it("should return 400", async () => {
      const response = await request(context.server).get(`/auth/v2/external/sign-out`).send()

      expect(response.status).toBe(400)
    })
  })

  describe("when redirect_uri is not allowed", () => {
    it("should return 400", async () => {
      const user = await context.data.createUser()
      const session = await context.data.createSession({ userId: user.id, identityProviderId: idp.id }, 1)
      const cookie = context.data.createAuthSessionCookie(session)

      const response = await request(context.server)
        .get("/auth/v2/external/sign-out?redirect_uri=https://host.com/not-allowed")
        .set("Cookie", [`auth-session=${cookie}`])
        .send()

      expect(response.status).toBe(400)
    })
  })

  describe("when session cookie is missing", () => {
    it("should return 401", async () => {
      const response = await request(context.server)
        .get(`/auth/v2/external/sign-out?redirect_uri=${idp.authSettings?.redirectUrls[0]}`)
        .send()

      expect(response.status).toBe(401)
    })
  })
})
