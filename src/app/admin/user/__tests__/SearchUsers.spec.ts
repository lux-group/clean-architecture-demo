import "@test/matchers/supertest"
import request from "supertest"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"

describe("[GET] /admin/users (SearchUsers)", () => {
  let context: TestContext

  beforeAll(async () => {
    context = await getTestContext()
  })

  describe("when users exist", () => {
    beforeEach(async () => {
      await context.data.createUser()
    })

    it("should return 200 with valid users", async () => {
      const response = await request(context.server)
        .get("/admin/users?offset=0&limit=10")
        .send()

      expect(response.status).toBe(200)
      expect(response.body.offset).toBe(0)
      expect(response.body.limit).toBe(10)
      expect(response.body.items).toBeInstanceOf(Array)
      expect(response.body.items.length).toBeGreaterThan(0)
    })
  })
})
