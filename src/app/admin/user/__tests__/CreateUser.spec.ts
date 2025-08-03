import "@test/matchers/supertest"
import { randomUUID } from "crypto"
import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"

describe("[POST] /admin/users", () => {
  let context: TestContext

  beforeAll(() => {
    context = getTestContext()
  })

  it("should return 201 with valid user", async () => {
    const payload = {
      is_enabled: true,
      brand: "Test Brand",
      given_name: randomUUID(),
      surname: randomUUID(),
      email: `${randomUUID()}@example.com`,
      phone: "+1234567890",
      country: "US",
      city: "Test City",
      postcode: "12345",
      password: "TestPassword123!",
      roles: ["user"]
    }

    const response = await request(context.server)
      .post("/admin/users")
      .send(payload)

    expect(response).toHaveStatus(201)
    expect(response.body).toEqual(expect.objectContaining({
      is_enabled: payload.is_enabled,
      brand: payload.brand,
      given_name: payload.given_name,
      surname: payload.surname,
      email: payload.email,
      phone: payload.phone,
      country: payload.country,
      city: payload.city,
      postcode: payload.postcode,
      roles: payload.roles,
      email_verified: false,
      identities: []
    }))
    expect(response.headers.location).toMatch(`/admin/users/${response.body.id}`)
  })
})
