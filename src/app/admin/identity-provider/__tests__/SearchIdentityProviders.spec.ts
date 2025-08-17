import "@test/matchers/supertest"
import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"
import { IdentityProvider } from "~/domain/entities"

describe("[GET] /admin/identity-providers (SearchIdentityProviders)", () => {
  let context: TestContext
  let identityProvider: IdentityProvider

  beforeAll(async () => {
    context = await getTestContext()
    identityProvider = await context.data.createIdentityProvider()
  })

  describe("when identity providers exist", () => {
    it("should return 200 with valid identity providers", async () => {
      const response = await request(context.server)
        .get("/admin/identity-providers?offset=0&limit=10")
        .send()

      expect(response.status).toBe(200)
      expect(response.body.total).toBeGreaterThanOrEqual(1)
      expect(response.body.items).toBeInstanceOf(Array)
      expect(response.body.items.length).toBeGreaterThanOrEqual(1)
    })

    it("should return filtered identity providers", async () => {
      const response = await request(context.server)
        .get(`/admin/identity-providers?offset=0&limit=10&name=${identityProvider.name}`)
        .send()

      expect(response.status).toBe(200)
      expect(response.body.total).toBe(1)
      expect(response.body.items.length).toBe(1)
      expect(response.body.items[0].id).toBe(identityProvider.id)
    })

    it("should return identity providers with selected fields", async () => {
      const response = await request(context.server)
        .get(`/admin/identity-providers?offset=0&limit=10&select=id,name`)
        .send()

      expect(response.status).toBe(200)
      expect(response.body.items.length).toBeGreaterThanOrEqual(1)
      expect(response.body.items[0].id).toBeDefined()
      expect(response.body.items[0].name).toBeDefined()
      expect(response.body.items[0].issuer_url).toBeUndefined()
      expect(response.body.items[0].audience).toBeUndefined()
    })

    it("should return paginated identity providers", async () => {
      const response = await request(context.server)
        .get(`/admin/identity-providers?offset=10000&limit=10`)
        .send()

      expect(response.status).toBe(200)
      expect(response.body.total).toBeGreaterThanOrEqual(1)
      expect(response.body.items.length).toBe(0)
    })

    it("should return sorted identity providers", async () => {
      const response = await request(context.server)
        .get(`/admin/identity-providers?offset=0&limit=10&order_by=name&order_direction=asc`)
        .send()

      expect(response.status).toBe(200)
    })
  })
})
