import "@test/matchers/supertest"
import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"

describe("[POST] /admin/sessions/:id/terminate", () => {
  let context: TestContext

  beforeAll(() => {
    context = getTestContext()
  })

  it("should return 204 and terminate session", async () => {
    const user = await context.data.createUser()
    const session = await context.data.createSession({ userId: user.id }, 24)

    const response = await request(context.server)
      .post(`/admin/sessions/${session.id}/terminate`)
      .send()

    expect(response).toHaveStatus(204)
    
    // Verify the session was terminated
    const updatedSession = await context.data.getSession(session.id)
    expect(updatedSession.terminatedAt).toBeDefined()
  })

  it("should return 404 when session does not exist", async () => {
    const response = await request(context.server)
      .post(`/admin/sessions/${crypto.randomUUID()}/terminate`)
      .send()

    expect(response).toHaveStatus(404)
  })
})
