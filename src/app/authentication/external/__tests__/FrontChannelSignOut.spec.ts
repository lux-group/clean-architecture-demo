import { randomUUID } from "node:crypto"
import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"
import { IdentityProvider, SessionStatus } from "~/domain/entities"

describe("[POST] /auth/external/frontchannel-sign-out (FrontChannelSignOut)", () => {
  let context: TestContext
  let identityProvider: IdentityProvider

  beforeAll(async () => {
    context = getTestContext()
    identityProvider = await context.data.createIdentityProvider()
  })

  describe("when the request has a valid session ID", () => {
    it("should terminate the session and return 200", async () => {
      const user = await context.data.createUser()
      let session = await context.data.createSession({
        userId: user.id,
        identityProviderId: identityProvider.id,
        identityProviderSessionId: randomUUID()
      }, 1)

      const response = await request(context.server)
        .get(`/auth/external/frontchannel-sign-out?sid=${session.identityProviderSessionId}`)
        .send()

      expect(response.status).toBe(200)

      session = await context.data.getSession(session.id)
      expect(session.status).toBe(SessionStatus.TerminatedByProvider)
    })
  })

  describe("when the session does not exist", () => {
    it("should return 200 even if session doesn't exist", async () => {
      const response = await request(context.server)
        .get(`/auth/external/frontchannel-sign-out?sid=${randomUUID()}`)
        .send()

      expect(response.status).toBe(200)
    })
  })
})

