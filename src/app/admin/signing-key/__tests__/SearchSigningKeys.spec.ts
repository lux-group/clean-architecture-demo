import "@test/matchers/supertest"
import request from "supertest"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"

describe("[GET] /admin/signing-keys", () => {
  let context: TestContext

  beforeAll(() => {
    context = getTestContext()
  })

  describe("when signing keys exist", () => {
    beforeEach(async () => {
      await context.data.createSigningKey()
    })

    it("should return 200 with valid signing keys", async () => {
      const response = await request(context.server)
        .get("/admin/signing-keys?offset=0&limit=10")
        .send()

      expect(response.status).toBe(200)
      expect(response.body.offset).toBe(0)
      expect(response.body.limit).toBe(10)
      expect(response.body.items).toBeInstanceOf(Array)
      expect(response.body.items.length).toBeGreaterThan(0)
    })
  })
})
