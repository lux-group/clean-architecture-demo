import "@test/matchers/supertest"
import request from "supertest"
import { beforeAll, describe, expect, it, vi } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"

describe("[POST] /admin/signing-keys", () => {
  let context: TestContext

  beforeAll(() => {
    context = getTestContext()
  })

  describe("when the creation was successful", () => {
    it("should return 201 with new signing key", async () => {
      const response = await request(context.server)
        .post("/admin/signing-keys")
        .send()
  
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty("id")
      expect(response.body).toHaveProperty("created_at")
      expect(response.body).toHaveProperty("updated_at")
      expect(response.body).toHaveProperty("public_key")
      expect(response.headers.location).toMatch(`/admin/signing-keys/${response.body.id}`)
    })
  
    it("should publish an event", async () => {
      const eventPublisher = context.container.resolve("eventPublisher")
      vi.spyOn(eventPublisher, "publishEvent").mockImplementation(() => {})

      const response = await request(context.server)
        .post("/admin/signing-keys")
        .send()
  
      expect(eventPublisher.publishEvent).toHaveBeenCalledTimes(2)
    })  
  
    it("should disable the existing signing key", async () => {
      let existingSigningKey = await context.data.createSigningKey()
  
      const response = await request(context.server)
        .post("/admin/signing-keys")
        .send()
  
      existingSigningKey = await context.data.getSigningKey(existingSigningKey.id)
      expect(existingSigningKey.privateKey).toBe(null)
    })  
  })
})
