import "@test/matchers/supertest"
import { randomUUID } from "node:crypto"
import request from "supertest"
import { beforeAll, describe, expect, it, vi } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"
import { EventPublisher } from "~/domain/adapters"

describe("[POST] /admin/identity-providers (CreateIdentityProvider)", () => {
  let context: TestContext
  let accessToken: string

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
    },
  })

  beforeAll(async () => {
    context = await getTestContext()
    accessToken = await context.createAccessToken(randomUUID(), ["identity-provider:write"])
  })

  describe("when the creation was successful", () => {
    it("should return 201 with valid identity provider", async () => {
      const payload = getPayload()

      const response = await request(context.server).post("/admin/identity-providers").set("Authorization", `Bearer ${accessToken}`).send(payload)

      expect(response.status).toBe(201)
      expect(response.body).toEqual(expect.objectContaining(payload))
      expect(response.headers.location).toMatch(`/admin/identity-providers/${response.body.id}`)
    })

    it("should create the identity provider in the database", async () => {
      const payload = getPayload()

      const response = await request(context.server).post("/admin/identity-providers").set("Authorization", `Bearer ${accessToken}`).send(payload)

      const created = await context.data.getIdentityProvider(response.body.id)
      expect(response).bodyToMatchEntity(created)
    })

    it("should publish an event", async () => {
      const payload = getPayload()

      const eventPublisher: EventPublisher = context.container.resolve("eventPublisher")
      vi.spyOn(eventPublisher, "publishEvent").mockImplementation(() => {})

      await request(context.server).post("/admin/identity-providers").set("Authorization", `Bearer ${accessToken}`).send(payload)

      expect(eventPublisher.publishEvent).toHaveBeenCalledOnce()
    })
  })

  describe("when authorization fails", () => {
    it("should return 401 when no access token is provided", async () => {
      const payload = getPayload()

      const response = await request(context.server).post("/admin/identity-providers").send(payload)

      expect(response.status).toBe(401)
    })

    it("should return 403 when the access token does not have scope 'identity-providers:write'", async () => {
      const payload = getPayload()
      const nonAdminAccessToken = await context.createAccessToken(randomUUID(), ["identity-provider:read"])

      const response = await request(context.server)
        .post("/admin/identity-providers")
        .set("Authorization", `Bearer ${nonAdminAccessToken}`)
        .send(payload)

      expect(response.status).toBe(403)
    })
  })
})
