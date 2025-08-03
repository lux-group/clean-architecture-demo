import "@test/matchers/supertest"
import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"

describe("[GET] /admin/users/:id", () => {
  let context: TestContext

  beforeAll(() => {
    context = getTestContext()
  })

  it("should return 200 with valid user", async () => {
    const user = await context.data.createUser()

    const response = await request(context.server)
      .get(`/admin/users/${user.id}`)
      .send()

    expect(response).toHaveStatus(200)
    expect(response).toMatchEntity(user)
  })

  it("should return 404 when user does not exist", async () => {
    const response = await request(context.server)
      .get(`/admin/users/${crypto.randomUUID()}`)
      .send()

    expect(response).toHaveStatus(404)
  })
})
