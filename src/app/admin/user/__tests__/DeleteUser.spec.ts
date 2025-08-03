import "@test/matchers/supertest"
import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"

describe("[DELETE] /admin/users/:id", () => {
  let context: TestContext

  beforeAll(() => {
    context = getTestContext()
  })

  it("should return 204", async () => {
    const user = await context.data.createUser()

    const response = await request(context.server)
      .delete(`/admin/users/${user.id}`)
      .send()

    const exists = await context.data.userExists(user.id)
    expect(response).toHaveStatus(204)
    expect(exists).toBe(false)
  })

  it("should return 404 when user does not exist", async () => {
    const response = await request(context.server)
      .delete(`/admin/users/${crypto.randomUUID()}`)
      .send()

    expect(response).toHaveStatus(404)
  })
})
