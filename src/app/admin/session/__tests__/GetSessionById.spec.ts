import "@test/matchers/supertest"
import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"

describe("[GET] /admin/sessions/:id (GetSessionById)", () => {
  let context: TestContext

  beforeAll(() => {
    context = getTestContext()
  })

  describe("when the session exists", () => {
    it("should return 200 with the correct session data", async () => {
      const user = await context.data.createUser()
      const session = await context.data.createSession({ userId: user.id }, 24)

      const response = await request(context.server)
        .get(`/admin/sessions/${session.id}`)
        .send()

      expect(response.status).toBe(200)
      expect(response).bodyToMatchEntity(session)
    })
  })

  describe("when the session does not exist", () => {
    it("should return 404", async () => {
      const response = await request(context.server)
        .get(`/admin/sessions/${crypto.randomUUID()}`)
        .send()

      expect(response.status).toBe(404)
    })
  })
})
