import "@test/matchers/supertest"
import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"

describe("[GET] /admin/signing-keys/:id", () => {
  let context: TestContext

  beforeAll(() => {
    context = getTestContext()
  })

  describe("when the signing key exists", () => {
    it("should return 200 with the correct signing key data", async () => {
      const signingKey = await context.data.createSigningKey()

      const response = await request(context.server)
        .get(`/admin/signing-keys/${signingKey.id}`)
        .send()

      expect(response.status).toBe(200)
      expect(response).bodyToMatchEntity(signingKey)
    })
  })

  describe("when the signing key does not exist", () => {
    it("should return 404", async () => {
      const response = await request(context.server)
        .get(`/admin/signing-keys/${crypto.randomUUID()}`)
        .send()

      expect(response.status).toBe(404)
    })
  })
})
