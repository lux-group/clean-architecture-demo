import { randomUUID } from "node:crypto"
import { expect } from "@jest/globals"
import request from "supertest"
import { getTestContext, TestContext } from "@test/component/support/TestContext"
import { IdentityProvider, SessionStatus } from "~/domain/entities"

describe("[POST] /auth/external/frontchannel-sign-out", () => {
  let context: TestContext
  let identityProvider: IdentityProvider

  beforeAll(async () => {
    context = await getTestContext()
    identityProvider = await context.data.createIdentityProvider({})
  })

  it("should handle custom sign-in URL", async () => {
    const user = await context.data.createUser({})
    let session = await context.data.createSession({
      userId: user.id,
      identityProviderId: identityProvider.id,
      identityProviderSessionId: randomUUID()
    }, 1)

    const response = await request(context.server)
      .get(`/auth/external/frontchannel-sign-out?sid=${session.identityProviderSessionId}`)
      .send()

    expect(response).toHaveStatus(200)

    session = await context.data.getSession(session.id)
    expect(session.status).toBe(SessionStatus.TerminatedByProvider)
  })

  it("should return 200 even if session doesn't exist", async () => {
    const response = await request(context.server)
      .get(`/auth/external/frontchannel-sign-out?sid=${randomUUID()}`)
      .send()

    expect(response).toHaveStatus(200)
  })

  // Additional scenarios can be added here:
  // - Session found but already terminated
})
