import "@test/matchers/supertest"
import { randomUUID } from "node:crypto"
import { getTestContext, TestContext } from "@test/integration/TestContext"
import request from "supertest"
import { beforeAll, describe, expect, it, vi } from "vitest"
import { EventPublisher } from "~/domain/adapters"

describe("[DELETE] /admin/signing-keys/:id (DeleteSigningKey)", () => {
  let context: TestContext
  let accessToken: string

  beforeAll(async () => {
    context = await getTestContext()
    accessToken = await context.createAccessToken(randomUUID(), ["signing-key:write"])
  })

  describe("when the deletion was successful", () => {
    it("should return 204", async () => {
      const signingKey = await context.data.createSigningKey({ privateKey: null })

      const response = await request(context.server)
        .delete(`/admin/signing-keys/${signingKey.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send()

      expect(response.status).toBe(204)
    })

    it("should remove the signing key from the database", async () => {
      const signingKey = await context.data.createSigningKey({ privateKey: null })

      await request(context.server)
        .delete(`/admin/signing-keys/${signingKey.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send()

      const exists = await context.data.signingKeyExists(signingKey.id)
      expect(exists).toBe(false)
    })

    it("should publish an event", async () => {
      const signingKey = await context.data.createSigningKey({ privateKey: null })

      const eventPublisher: EventPublisher = context.container.resolve("eventPublisher")
      vi.spyOn(eventPublisher, "publishEvent").mockImplementation(() => {})

      await request(context.server)
        .delete(`/admin/signing-keys/${signingKey.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send()

      expect(eventPublisher.publishEvent).toHaveBeenCalledOnce()
    })
  })

  describe("when the signing key is active", () => {
    it("should return 400", async () => {
      const signingKey = await context.data.createSigningKey()

      const response = await request(context.server)
        .delete(`/admin/signing-keys/${signingKey.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send()

      expect(response.status).toBe(400)
    })
  })

  describe("when the signing key does not exist", () => {
    it("should return 404", async () => {
      const response = await request(context.server)
        .delete(`/admin/signing-keys/${randomUUID()}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send()

      expect(response.status).toBe(404)
    })
  })

  describe("when authorization fails", () => {
    it("should return 401 when no access token is provided", async () => {
      const signingKey = await context.data.createSigningKey({ privateKey: null })

      const response = await request(context.server).delete(`/admin/signing-keys/${signingKey.id}`).send()

      expect(response.status).toBe(401)
    })

    it("should return 403 when the access token does not have scope 'signing-keys:write'", async () => {
      const signingKey = await context.data.createSigningKey({ privateKey: null })
      const nonWriteAccessToken = await context.createAccessToken(randomUUID(), ["signing-key:read"])

      const response = await request(context.server)
        .delete(`/admin/signing-keys/${signingKey.id}`)
        .set("Authorization", `Bearer ${nonWriteAccessToken}`)
        .send()

      expect(response.status).toBe(403)
    })
  })
})
