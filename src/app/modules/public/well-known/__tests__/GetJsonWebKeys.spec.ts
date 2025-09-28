import { getTestContext, TestContext } from "@test/integration/TestContext"
import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"

describe("[GET] /oauth2/.well-known/jwks (GetJsonWebKeys)", () => {
  let context: TestContext

  beforeAll(async () => {
    context = await getTestContext()
    await context.data.createSigningKey()
  })

  describe("when requesting JSON web keys", () => {
    it("should return 200 with valid keys", async () => {
      const response = await request(context.server).get("/oauth2/.well-known/jwks").send()

      expect(response.status).toBe(200)
      expect(response.body.keys).toBeInstanceOf(Array)
      expect(response.body.keys.length).toBeGreaterThan(0)
    })
  })
})
