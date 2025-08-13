import "@test/matchers/supertest"
import { randomUUID } from "node:crypto"
import request from "supertest"
import { beforeAll, describe, expect, it, vi } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"
import { EventPublisher } from "~/domain/adapters"

describe("[PUT] /admin/identity-providers/:id (UpdateIdentityProvider)", () => {
  let context: TestContext

  beforeAll(async () => {
    context = await getTestContext()
  })

  describe("when the update was successful", () => {
    const getPayload = () => ({
      name: randomUUID(),
      issuer_url: "https://updated.test.com",
      audience: randomUUID(),
      identifier_claim_name: "updated",
      auth_settings: {
        type: "ENTRA",
        brand: "Test Brand updated",
        client_id: randomUUID(),
        client_secret: randomUUID(),
        redirect_urls: ["https://test.updated.com"],
        auto_link_users: true,
        auto_create_users: true,
      }
    })

    it("should return 200 with valid identity provider", async () => {
      const original = await context.data.createIdentityProvider()
      const payload = getPayload()

      const response = await request(context.server)
        .put(`/admin/identity-providers/${original.id}`)
        .send(payload)

      expect(response.status).toBe(200)
      expect(response.body).toEqual(expect.objectContaining(payload))
    })

    it("should update the identity provider in the database", async () => {
      const original = await context.data.createIdentityProvider()
      const payload = getPayload()
      
      const response = await request(context.server)
        .put(`/admin/identity-providers/${original.id}`)
        .send(payload)

      const updated = await context.data.getIdentityProvider(original.id)
      expect(response).bodyToMatchEntity(updated)
    })

    it("should publish an event", async () => {
      const original = await context.data.createIdentityProvider()
      const payload = getPayload()

      const eventPublisher: EventPublisher = context.container.resolve("eventPublisher")
      vi.spyOn(eventPublisher, "publishEvent").mockImplementation(() => {})

      await request(context.server)
        .put(`/admin/identity-providers/${original.id}`)
        .send(payload)

      expect(eventPublisher.publishEvent).toHaveBeenCalledOnce()
    })
  })

  describe("when the identity provider does not exist", () => {
    it("should return 404", async () => {
      const response = await request(context.server)
        .delete(`/admin/identity-providers/${randomUUID()}`)
        .send()

      expect(response.status).toBe(404)
    })
  })
})
