import "@test/matchers/supertest"
import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"

describe("[GET] /admin/identity-providers/:id", () => {
  let context: TestContext

  beforeAll(() => {
    context = getTestContext()
  })

  it("should return 200 with valid identity provider", async () => {
    const identityProvider = await context.data.createIdentityProvider()

    const response = await request(context.server)
      .get(`/admin/identity-providers/${identityProvider.id}`)
      .send()

    expect(response).toHaveStatus(200)
    expect(response).toMatchEntity(identityProvider)
  })

  it("should return 404 when identity provider does not exist", async () => {
    const response = await request(context.server)
      .get(`/admin/identity-providers/${crypto.randomUUID()}`)
      .send()

    expect(response).toHaveStatus(404)
  })
})
