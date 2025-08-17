import "@test/matchers/supertest"
import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"
import { SigningKey } from "~/domain/entities"

describe("[GET] /admin/signing-keys (SearchSigningKeys)", () => {
  let context: TestContext
  let signingKey: SigningKey

  beforeAll(async () => {
    context = await getTestContext()
    signingKey = await context.data.createSigningKey()
  })

  describe("when signing keys exist", () => {
    it("should return 200 with valid signing keys", async () => {
      const response = await request(context.server)
        .get("/admin/signing-keys?offset=0&limit=10")
        .send()

      expect(response.status).toBe(200)
      expect(response.body.total).toBeGreaterThanOrEqual(1)
      expect(response.body.items).toBeInstanceOf(Array)
      expect(response.body.items.length).toBeGreaterThanOrEqual(1)
    })

    it("should return paginated signing keys", async () => {
      const response = await request(context.server)
        .get(`/admin/signing-keys?offset=10000&limit=10`)
        .send()

      expect(response.status).toBe(200)
      expect(response.body.total).toBeGreaterThanOrEqual(1)
      expect(response.body.items.length).toBe(0)
    })

    it("should return signing keys with selected fields", async () => {
      const response = await request(context.server)
        .get(`/admin/signing-keys?offset=0&limit=10&select=id,public_key`)
        .send()

      expect(response.status).toBe(200)
      expect(response.body.items.length).toBeGreaterThanOrEqual(1)
      expect(response.body.items[0].id).toBeDefined()
      expect(response.body.items[0].public_key).toBeDefined()
      expect(response.body.items[0].created_at).toBeUndefined()
      expect(response.body.items[0].updated_at).toBeUndefined()
      expect(response.body.items[0].expires_at).toBeUndefined()
    })

    it("should return sorted signing keys", async () => {
      const response = await request(context.server)
        .get(`/admin/signing-keys?offset=0&limit=10&order_by=created_at&order_direction=asc`)
        .send()

      expect(response.status).toBe(200)
    })
  })
})
