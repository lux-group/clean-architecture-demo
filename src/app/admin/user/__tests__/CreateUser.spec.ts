import "@test/matchers/supertest"
import { randomUUID } from "node:crypto"
import request from "supertest"
import { beforeAll, describe, expect, it, vi } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"
import { EventPublisher } from "~/domain/adapters"

describe("[POST] /admin/users (CreateUser)", () => {
  let context: TestContext
  let accessToken: string

  beforeAll(async () => {
    context = await getTestContext()
    accessToken = await context.data.createAccessToken(randomUUID(), ["users:write"])    
  })

  const defaultPayload = {
    is_enabled: true,
    brand: "Test Brand",
    given_name: "Given",
    surname: "Surname",
    phone: "+1234567890",
    country: "US",
    city: "Test City",
    postcode: "12345",
    password: "TestPassword123!",
    roles: ["user"]
  }

  const getPayload = (overrides: Partial<typeof defaultPayload & { email: string }> = {}) => ({
    ...defaultPayload,
    given_name: overrides.given_name ?? randomUUID(),
    surname: overrides.surname ?? randomUUID(),
    email: overrides.email ?? `${randomUUID()}@example.com`,
    ...overrides,
  })

  describe("when the creation was successful", () => {

    it("should return 201 with valid user", async () => {
      const payload = getPayload()
      
      const response = await request(context.server)
        .post("/admin/users")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(payload)

      expect(response.status).toBe(201)
      expect(response.body).toEqual(expect.objectContaining({
        is_enabled: payload.is_enabled,
        brand: payload.brand,
        given_name: payload.given_name,
        surname: payload.surname,
        email: payload.email,
        phone: payload.phone,
        country: payload.country,
        city: payload.city,
        postcode: payload.postcode,
        roles: payload.roles,
        email_verified: false,
        identities: []
      }))
      expect(response.headers.location).toMatch(`/admin/users/${response.body.id}`)
    })

    it("should create the user in the database", async () => {
      const payload = getPayload()
      
      const response = await request(context.server)
        .post("/admin/users")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(payload)

      const created = await context.data.getUser(response.body.id)
      expect(response).bodyToMatchEntity(created)
    })

    it("should publish an event", async () => {
      const payload = getPayload()
      
      const eventPublisher: EventPublisher = context.container.resolve("eventPublisher")
      vi.spyOn(eventPublisher, "publishEvent").mockImplementation(() => {})

      await request(context.server)
        .post("/admin/users")
        .set("Authorization", `Bearer ${accessToken}`)
        .send(payload)

      expect(eventPublisher.publishEvent).toHaveBeenCalledOnce()
    })
  })

  describe("when authorization fails", () => {
    it("should return 401 when no access token is provided", async () => {
      const payload = getPayload()

      const response = await request(context.server)
        .post("/admin/users")
        .send(payload)

      expect(response.status).toBe(401)
    })

    it("should return 403 when the access token does not have scope 'users:write'", async () => {
      const payload = getPayload()
      const nonWriteAccessToken = await context.data.createAccessToken(randomUUID(), ["users:read"]) 

      const response = await request(context.server)
        .post("/admin/users")
        .set("Authorization", `Bearer ${nonWriteAccessToken}`)
        .send(payload)

      expect(response.status).toBe(403)
    })
  })
})
