import "@test/matchers/supertest"
import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"

describe("[GET] /admin/signing-keys/:id", () => {
  let context: TestContext

  beforeAll(() => {
    context = getTestContext()
  })

  it("should return 200 with valid signing key", async () => {
    const signingKey = await context.data.createSigningKey()

    const response = await request(context.server)
      .get(`/admin/signing-keys/${signingKey.id}`)
      .send()

    expect(response).toHaveStatus(200)
    expect(response).toMatchEntity(signingKey)
  })

  it("should return 404 when signing key does not exist", async () => {
    const response = await request(context.server)
      .get(`/admin/signing-keys/${crypto.randomUUID()}`)
      .send()

    expect(response).toHaveStatus(404)
  })
})
