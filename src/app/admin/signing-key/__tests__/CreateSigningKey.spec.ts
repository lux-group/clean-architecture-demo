import "@test/matchers/supertest"
import request from "supertest"
import { beforeAll, describe, expect, it, vi } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"

describe("[POST] /admin/signing-keys", () => {
  let context: TestContext

  beforeAll(() => {
    context = getTestContext()
  })

  // We keep all assertions in one test because creating signing keys is a very
  // slow and resource-intensive operation and we want to keep the test fast.
  describe("when the creation was successful", () => {
    it("should return 201 with new signing key", async () => {
      const eventPublisher = context.container.resolve("eventPublisher")
      vi.spyOn(eventPublisher, "publishEvent").mockImplementation(() => {})

      let existingSigningKey = await context.data.createSigningKey()

      const response = await request(context.server)
        .post("/admin/signing-keys")
        .send()
  
      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty("id")
      expect(response.body).toHaveProperty("created_at")
      expect(response.body).toHaveProperty("updated_at")
      expect(response.body).toHaveProperty("public_key")
      expect(response.headers.location).toMatch(`/admin/signing-keys/${response.body.id}`)
      
      expect(eventPublisher.publishEvent).toHaveBeenCalledTimes(2)
  
      existingSigningKey = await context.data.getSigningKey(existingSigningKey.id)
      expect(existingSigningKey.privateKey).toBe(null)
    })  
  })
})
