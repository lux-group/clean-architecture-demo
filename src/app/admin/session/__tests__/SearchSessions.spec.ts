import "@test/matchers/supertest"
import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"
import { Session } from "~/domain/entities"

describe("[GET] /admin/sessions (SearchSessions)", () => {
  let context: TestContext
  let session: Session

  beforeAll(async () => {
    context = await getTestContext()

    const user = await context.data.createUser()
    session = await context.data.createSession({ userId: user.id }, 24)
  })

  describe("when sessions exist", () => {
    it("should return 200 with valid sessions", async () => {
      const response = await request(context.server)
        .get("/admin/sessions?offset=0&limit=10")
        .send()

      expect(response.status).toBe(200)
      expect(response.body.total).toBeGreaterThanOrEqual(1)
      expect(response.body.items).toBeInstanceOf(Array)
      expect(response.body.items.length).toBeGreaterThanOrEqual(1)
    })

    it("should return filtered sessions", async () => {
      const response = await request(context.server)
        .get(`/admin/sessions?offset=0&limit=10&user_id=${session.userId}`)
        .send()

      expect(response.status).toBe(200)
      expect(response.body.total).toBe(1)
      expect(response.body.items.length).toBe(1)
      expect(response.body.items[0].id).toBe(session.id)
    })

    it("should return paginated sessions", async () => {
      const response = await request(context.server)
        .get(`/admin/sessions?offset=10000&limit=10`)
        .send()

      expect(response.status).toBe(200)
      expect(response.body.total).toBeGreaterThanOrEqual(1)
      expect(response.body.items.length).toBe(0)
    })

    it("should return sessions with selected fields", async () => {
      const response = await request(context.server)
      .get(`/admin/sessions?offset=0&limit=10&select=id,user_id`)
      .send()

      expect(response.status).toBe(200)
      expect(response.body.items.length).toBeGreaterThanOrEqual(1)
      expect(response.body.items[0].id).toBeDefined()
      expect(response.body.items[0].user_id).toBeDefined()
      expect(response.body.items[0].identity_provider_session_id).toBeUndefined()
    })

    it("should return sorted sessions", async () => {
      const response = await request(context.server)
        .get(`/admin/sessions?offset=0&limit=10&order_by=created_at&order_direction=asc`)
        .send()

      expect(response.status).toBe(200)
    })
  })
})
