import request from "supertest"
import { expect } from "@test/matchers/supertest"
import { getTestContext, TestContext } from "@test/integration/TestContext"

describe("[GET] /oauth2/.well-known/openid-configuration", () => {
  let context: TestContext

  beforeAll(async () => {
    context = await getTestContext()
  })

  it("should return 200 with valid configuration", async () => {
    const response = await request(context.server)
      .get("/oauth2/.well-known/openid-configuration")
      .send()

    expect(response).toHaveStatus(200)
    expect(response.body.jwks_uri).toMatch(/\.well-known\/jwks$/)
  })
})
