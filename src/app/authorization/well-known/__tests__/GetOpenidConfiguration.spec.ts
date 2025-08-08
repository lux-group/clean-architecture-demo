import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"

describe("[GET] /oauth2/.well-known/openid-configuration (GetOpenidConfiguration)", () => {
  let context: TestContext

  beforeAll(async () => {
    context = await getTestContext()
  })

  describe("when requesting OpenID configuration", () => {
    it("should return 200 with valid configuration", async () => {
      const response = await request(context.server)
        .get("/oauth2/.well-known/openid-configuration")
        .send()

      expect(response.status).toBe(200)
      expect(response.body.jwks_uri).toMatch(/\.well-known\/jwks$/)
    })
  })
})
