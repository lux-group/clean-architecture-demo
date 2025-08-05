import "@test/matchers/supertest"
import request from "supertest"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"

describe("[GET] /admin/identity-providers (SearchIdentityProviders)", () => {
  let context: TestContext

  beforeAll(() => {
    context = getTestContext()
  })

  describe("when identity providers exist", () => {
    beforeEach(async () => {
      await context.data.createIdentityProvider()
    })

    it("should return 200 with valid identity providers", async () => {
      const response = await request(context.server)
        .get("/admin/identity-providers?offset=0&limit=10")
        .send()

      expect(response.status).toBe(200)
      expect(response.body.offset).toBe(0)
      expect(response.body.limit).toBe(10)
      expect(response.body.items).toBeInstanceOf(Array)
      expect(response.body.items.length).toBeGreaterThan(0)
    })
  })
})
