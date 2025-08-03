import "@test/matchers/supertest"
import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"

describe("[GET] /admin/sessions/:id", () => {
  let context: TestContext

  beforeAll(() => {
    context = getTestContext()
  })

  it("should return 200 with valid session", async () => {
    const user = await context.data.createUser()
    const session = await context.data.createSession({ userId: user.id }, 24)

    const response = await request(context.server)
      .get(`/admin/sessions/${session.id}`)
      .send()

    expect(response).toHaveStatus(200)
    expect(response).toMatchEntity(session)
  })

  it("should return 404 when session does not exist", async () => {
    const response = await request(context.server)
      .get(`/admin/sessions/${crypto.randomUUID()}`)
      .send()

    expect(response).toHaveStatus(404)
  })
})
