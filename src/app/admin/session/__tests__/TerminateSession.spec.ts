import "@test/matchers/supertest"
import request from "supertest"
import { beforeAll, describe, expect, it, vi } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"
import { EventPublisher } from "~/domain/adapters"

describe("[POST] /admin/sessions/:id/terminate (TerminateSession)", () => {
  let context: TestContext

  beforeAll(async () => {
    context = await getTestContext()
  })

  describe("when the termination was successful", () => {
    it("should return 204", async () => {
      const user = await context.data.createUser()
      const session = await context.data.createSession({ userId: user.id }, 24)

      const response = await request(context.server)
        .post(`/admin/sessions/${session.id}/terminate`)
        .send()

      expect(response.status).toBe(204)
    })

    it("should terminate the session in the database", async () => {
      const user = await context.data.createUser()
      const session = await context.data.createSession({ userId: user.id }, 24)

      await request(context.server)
        .post(`/admin/sessions/${session.id}/terminate`)
        .send()

      const updatedSession = await context.data.getSession(session.id)
      expect(updatedSession.terminatedAt).toBeDefined()
    })

    it("should publish an event", async () => {
      const user = await context.data.createUser()
      const session = await context.data.createSession({ userId: user.id }, 24)
      
      const eventPublisher: EventPublisher = context.container.resolve("eventPublisher")
      vi.spyOn(eventPublisher, "publishEvent").mockImplementation(() => {})

      await request(context.server)
        .post(`/admin/sessions/${session.id}/terminate`)
        .send()

      expect(eventPublisher.publishEvent).toHaveBeenCalledOnce()
    })
  })

  describe("when the session does not exist", () => {
    it("should return 404", async () => {
      const response = await request(context.server)
        .post(`/admin/sessions/${crypto.randomUUID()}/terminate`)
        .send()

      expect(response.status).toBe(404)
    })
  })
})
