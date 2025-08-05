import "@test/matchers/supertest"
import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
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
  })
})
