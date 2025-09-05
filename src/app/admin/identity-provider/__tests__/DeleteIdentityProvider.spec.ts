import "@test/matchers/supertest"
import { randomUUID } from "node:crypto"
import { getTestContext, TestContext } from "@test/integration/TestContext"
import request from "supertest"
import { beforeAll, describe, expect, it, vi } from "vitest"
import { EventPublisher } from "~/domain/adapters"

describe("[DELETE] /admin/identity-providers/:id (DeleteIdentityProvider)", () => {
  let context: TestContext
  let accessToken: string

  beforeAll(async () => {
    context = await getTestContext()
    accessToken = await context.createAccessToken(randomUUID(), ["identity-provider:write"])
  })

  describe("when the deletion was successful", () => {
    it("should return 204", async () => {
      const identityProvider = await context.data.createIdentityProvider()

      const response = await request(context.server)
        .delete(`/admin/identity-providers/${identityProvider.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send()

      expect(response.status).toBe(204)
    })

    it("should remove the identity provider from the database", async () => {
      const identityProvider = await context.data.createIdentityProvider()

      await request(context.server)
        .delete(`/admin/identity-providers/${identityProvider.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send()

      const exists = await context.data.identityProviderExists(identityProvider.id)
      expect(exists).toBe(false)
    })

    it("should publish an event", async () => {
      const identityProvider = await context.data.createIdentityProvider()

      const eventPublisher: EventPublisher = context.container.resolve("eventPublisher")
      vi.spyOn(eventPublisher, "publishEvent").mockImplementation(() => {})

      await request(context.server)
        .delete(`/admin/identity-providers/${identityProvider.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send()

      expect(eventPublisher.publishEvent).toHaveBeenCalledOnce()
    })
  })

  describe("when the identity provider does not exist", () => {
    it("should return 404", async () => {
      const response = await request(context.server)
        .delete(`/admin/identity-providers/${randomUUID()}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send()

      expect(response.status).toBe(404)
    })
  })

  describe("when authorization fails", () => {
    it("should return 401 when no access token is provided", async () => {
      const identityProvider = await context.data.createIdentityProvider()

      const response = await request(context.server).delete(`/admin/identity-providers/${identityProvider.id}`).send()

      expect(response.status).toBe(401)
    })

    it("should return 403 when the access token does not have scope 'identity-providers:write'", async () => {
      const identityProvider = await context.data.createIdentityProvider()
      const nonWriteAccessToken = await context.createAccessToken(randomUUID(), ["identity-provider:read"])

      const response = await request(context.server)
        .delete(`/admin/identity-providers/${identityProvider.id}`)
        .set("Authorization", `Bearer ${nonWriteAccessToken}`)
        .send()

      expect(response.status).toBe(403)
    })
  })
})
