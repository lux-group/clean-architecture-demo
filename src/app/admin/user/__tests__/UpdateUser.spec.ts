import "@test/matchers/supertest"
import request from "supertest"
import { beforeAll, describe, expect, it, vi } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"
import { EventPublisher } from "~/domain/adapters"

describe("[PUT] /admin/users/:id (UpdateUser)", () => {
  let context: TestContext

  beforeAll(() => {
    context = getTestContext()
  })

  describe("when the update was successful", () => {
    const getPayload = () => ({
      is_enabled: false,
      given_name: "Updated Name",
      surname: "Updated Surname",
      country: "CA",
      city: "Updated City", 
      postcode: "54321",
      roles: ["admin", "user"]
    })

    it("should return 200 with updated user", async () => {
      const original = await context.data.createUser()
      const payload = getPayload()

      const response = await request(context.server)
        .put(`/admin/users/${original.id}`)
        .send(payload)

      expect(response.status).toBe(200)
      expect(response.body).toEqual(expect.objectContaining(payload))
    })

    it("should update the user in the database", async () => {
      const original = await context.data.createUser()
      const payload = getPayload()

      const response = await request(context.server)
        .put(`/admin/users/${original.id}`)
        .send(payload)

      const updated = await context.data.getUser(original.id)
      expect(response).bodyToMatchEntity(updated)
    })

    it("should publish an event", async () => {
      const original = await context.data.createUser()
      const payload = getPayload()

      const eventPublisher: EventPublisher = context.container.resolve("eventPublisher")
      vi.spyOn(eventPublisher, "publishEvent").mockImplementation(() => {})

      await request(context.server)
        .put(`/admin/users/${original.id}`)
        .send(payload)

      expect(eventPublisher.publishEvent).toHaveBeenCalledOnce()
    })
  })

  describe("when the user does not exist", () => {
    it("should return 404", async () => {
      const payload = {
        is_enabled: false,
        given_name: "Updated Name",
        surname: "Updated Surname"
      }

      const response = await request(context.server)
        .put(`/admin/users/${crypto.randomUUID()}`)
        .send(payload)

      expect(response.status).toBe(404)
    })
  })
})
