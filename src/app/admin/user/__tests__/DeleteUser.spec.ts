import "@test/matchers/supertest"
import { randomUUID } from "node:crypto"
import request from "supertest"
import { beforeAll, describe, expect, it, vi } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"
import { EventPublisher } from "~/domain/adapters"

describe("[DELETE] /admin/users/:id (DeleteUser)", () => {
  let context: TestContext
  let accessToken: string

  beforeAll(async () => {
    context = await getTestContext()
    accessToken = await context.data.createAccessToken(randomUUID(), ["users:write"])    
  })

  describe("when the deletion was successful", () => {
    it("should return 204", async () => {
      const user = await context.data.createUser()

      const response = await request(context.server)
        .delete(`/admin/users/${user.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send()

      expect(response.status).toBe(204)
    })

    it("should remove the user from the database", async () => {
      const user = await context.data.createUser()

      await request(context.server)
        .delete(`/admin/users/${user.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send()

      const exists = await context.data.userExists(user.id)
      expect(exists).toBe(false)
    })

    it("should publish an event", async () => {
      const user = await context.data.createUser()
      
      const eventPublisher: EventPublisher = context.container.resolve("eventPublisher")
      vi.spyOn(eventPublisher, "publishEvent").mockImplementation(() => {})

      await request(context.server)
        .delete(`/admin/users/${user.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send()

      expect(eventPublisher.publishEvent).toHaveBeenCalledOnce()
    })
  })

  describe("when the user does not exist", () => {
    it("should return 404", async () => {
      const response = await request(context.server)
        .delete(`/admin/users/${randomUUID()}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send()

      expect(response.status).toBe(404)
    })
  })

  describe("when authorization fails", () => {
    it("should return 401 when no access token is provided", async () => {
      const user = await context.data.createUser()

      const response = await request(context.server)
        .delete(`/admin/users/${user.id}`)
        .send()

      expect(response.status).toBe(401)
    })

    it("should return 403 when the access token does not have scope 'users:write'", async () => {
      const user = await context.data.createUser()
      const nonWriteAccessToken = await context.data.createAccessToken(randomUUID(), ["users:read"]) 

      const response = await request(context.server)
        .delete(`/admin/users/${user.id}`)
        .set("Authorization", `Bearer ${nonWriteAccessToken}`)
        .send()

      expect(response.status).toBe(403)
    })
  })
})
