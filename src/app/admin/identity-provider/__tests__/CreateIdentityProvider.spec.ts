import "@test/matchers/supertest"
import { randomUUID } from "crypto"
import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"

describe("[POST] /admin/identity-providers", () => {
  let context: TestContext

  beforeAll(() => {
    context = getTestContext()
  })

  it("should return 201 with valid identity provider", async () => {
    const payload = {
      name: randomUUID(),
      issuer_url: "https://updated.test.com",
      audience: randomUUID(),
      identifier_claim_name: "updated",
      auth_settings: {
        type: "ENTRA",
        brand: "Test Brand updated",
        client_id: randomUUID(),
        client_secret: randomUUID(),
        redirect_urls: ["https://test.updated.com"],
        auto_link_users: true,
        auto_create_users: true,
      }
    }

    const response = await request(context.server)
      .post("/admin/identity-providers")
      .send(payload)

    expect(response).toHaveStatus(201)
    expect(response.body).toEqual(expect.objectContaining(payload))
    expect(response.headers.location).toMatch(`/admin/identity-providers/${response.body.id}`)
  })
})
