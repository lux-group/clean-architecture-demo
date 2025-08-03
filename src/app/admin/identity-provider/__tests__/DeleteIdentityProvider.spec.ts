import "@test/matchers/supertest"
import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"

describe("[DELETE] /admin/identity-providers/:id", () => {
  let context: TestContext

  beforeAll(() => {
    context = getTestContext()
  })

  it("should return 204", async () => {
    const identityProvider = await context.data.createIdentityProvider()

    const response = await request(context.server)
      .delete(`/admin/identity-providers/${identityProvider.id}`)
      .send()

    const exists = await context.data.identityProviderExists(identityProvider.id)
    expect(response).toHaveStatus(204)
    expect(exists).toBe(false)
  })

  it("should return 404 when identity provider does not exist", async () => {
    const response = await request(context.server)
      .delete(`/admin/identity-providers/${crypto.randomUUID()}`)
      .send()

    expect(response).toHaveStatus(404)
  })
})
