import request from "supertest"
import { getTestContext, TestContext } from "@test/integration/TestContext"
import { setupSupertestMatchers } from "@test/matchers/supertest"

setupSupertestMatchers()

describe("[GET] /oauth2/.well-known/jwks", () => {
  let context: TestContext

  beforeAll(async () => {
    context = getTestContext()
    await context.data.createSigningKey()
  })

  it("should return 200 with valid keys", async () => {
    const response = await request(context.server)
      .get("/oauth2/.well-known/jwks")
      .send()

    expect(response).toHaveStatus(200)
    expect(response.body.keys).toBeInstanceOf(Array)
    expect(response.body.keys.length).toBeGreaterThan(0)
  })
})
