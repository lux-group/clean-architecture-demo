import "@test/matchers/supertest"
import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"

describe("[DELETE] /admin/signing-keys/:id", () => {
  let context: TestContext

  beforeAll(() => {
    context = getTestContext()
  })

  it("should return 204", async () => {
    const signingKey = await context.data.createSigningKey({ privateKey: null })

    const response = await request(context.server)
      .delete(`/admin/signing-keys/${signingKey.id}`)
      .send()

    const exists = await context.data.signingKeyExists(signingKey.id)
    expect(response).toHaveStatus(204)
    expect(exists).toBe(false)
  })

  it("should return 400 when signing key is active", async () => {
    const signingKey = await context.data.createSigningKey()

    const response = await request(context.server)
      .delete(`/admin/signing-keys/${signingKey.id}`)
      .send()

    expect(response).toHaveStatus(400)
  })

  it("should return 404 when signing key does not exist", async () => {
    const response = await request(context.server)
      .delete(`/admin/signing-keys/${crypto.randomUUID()}`)
      .send()

    expect(response).toHaveStatus(404)
  })
})
