import "@test/matchers/supertest"
import { randomUUID } from "node:crypto"
import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"

describe("[GET] /admin/users/:id (GetUserById)", () => {
  let context: TestContext

  beforeAll(async () => {
    context = await getTestContext()
  })

  describe("when the user exists", () => {
    it("should return 200 with the correct user data", async () => {
      const user = await context.data.createUser()

      const response = await request(context.server)
        .get(`/admin/users/${user.id}`)
        .send()

      expect(response.status).toBe(200)
      expect(response).bodyToMatchEntity(user)
    })
  })

  describe("when the user does not exist", () => {
    it("should return 404", async () => {
      const response = await request(context.server)
        .get(`/admin/users/${randomUUID()}`)
        .send()

      expect(response.status).toBe(404)
    })
  })
})
