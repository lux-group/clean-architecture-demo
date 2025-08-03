import "@test/matchers/supertest"
import { randomUUID } from "crypto"
import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"

describe("[PUT] /admin/users/:id", () => {
  let context: TestContext

  beforeAll(() => {
    context = getTestContext()
  })

  it("should return 200 with valid user", async () => {
    const original = await context.data.createUser()

    const payload = {
      is_enabled: false,
      given_name: "Updated Name",
      surname: "Updated Surname",
      country: "CA",
      city: "Updated City", 
      postcode: "54321",
      roles: ["admin", "user"]
    }

    const response = await request(context.server)
      .put(`/admin/users/${original.id}`)
      .send(payload)

    expect(response).toHaveStatus(200)
    expect(response.body).toEqual(expect.objectContaining(payload))

    const updated = await context.data.getUser(original.id)
    expect(response).toMatchEntity(updated)
  })

  it("should return 404 when user does not exist", async () => {
    const payload = {
      is_enabled: false,
      given_name: "Updated Name",
      surname: "Updated Surname"
    }

    const response = await request(context.server)
      .put(`/admin/users/${crypto.randomUUID()}`)
      .send(payload)

    expect(response).toHaveStatus(404)
  })
})
