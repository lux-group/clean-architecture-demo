import "@test/matchers/supertest"
import { randomUUID } from "node:crypto"
import { getTestContext, TestContext } from "@test/integration/TestContext"
import request from "supertest"
import { beforeAll, describe, expect, it, vi } from "vitest"
import { EventPublisher } from "~/domain/adapters"

describe("[POST] /admin/sessions/:id/terminate (TerminateSession)", () => {
  let context: TestContext
  let accessToken: string

  beforeAll(async () => {
    context = await getTestContext()
    accessToken = await context.createAccessToken(randomUUID(), ["session:write"])
  })

  describe("when the termination was successful", () => {
    it("should return 204", async () => {
      const user = await context.data.createUser()
      const session = await context.data.createSession({ userId: user.id }, 24)

      const response = await request(context.server)
        .post(`/admin/sessions/${session.id}/terminate`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send()

      expect(response.status).toBe(204)
    })

    it("should terminate the session in the database", async () => {
      const user = await context.data.createUser()
      const session = await context.data.createSession({ userId: user.id }, 24)

      await request(context.server).post(`/admin/sessions/${session.id}/terminate`).set("Authorization", `Bearer ${accessToken}`).send()

      const updatedSession = await context.data.getSession(session.id)
      expect(updatedSession.terminatedAt).toBeDefined()
    })

    it("should publish an event", async () => {
      const user = await context.data.createUser()
      const session = await context.data.createSession({ userId: user.id }, 24)

      const eventPublisher: EventPublisher = context.container.resolve("eventPublisher")
      vi.spyOn(eventPublisher, "publishEvent").mockImplementation(() => {})

      await request(context.server).post(`/admin/sessions/${session.id}/terminate`).set("Authorization", `Bearer ${accessToken}`).send()

      expect(eventPublisher.publishEvent).toHaveBeenCalledOnce()
    })
  })

  describe("when the session does not exist", () => {
    it("should return 404", async () => {
      const response = await request(context.server)
        .post(`/admin/sessions/${randomUUID()}/terminate`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send()

      expect(response.status).toBe(404)
    })
  })

  describe("when authorization fails", () => {
    it("should return 401 when no access token is provided", async () => {
      const user = await context.data.createUser()
      const session = await context.data.createSession({ userId: user.id }, 24)

      const response = await request(context.server).post(`/admin/sessions/${session.id}/terminate`).send()

      expect(response.status).toBe(401)
    })

    it("should return 403 when the access token does not have scope 'sessions:write'", async () => {
      const user = await context.data.createUser()
      const session = await context.data.createSession({ userId: user.id }, 24)
      const nonWriteAccessToken = await context.createAccessToken(user.id, ["session:read"])

      const response = await request(context.server)
        .post(`/admin/sessions/${session.id}/terminate`)
        .set("Authorization", `Bearer ${nonWriteAccessToken}`)
        .send()

      expect(response.status).toBe(403)
    })
  })
})
