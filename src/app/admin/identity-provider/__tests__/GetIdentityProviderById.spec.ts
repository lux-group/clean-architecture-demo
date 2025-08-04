import "@test/matchers/supertest"
import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"

describe("[GET] /admin/identity-providers/:id", () => {
  let context: TestContext

  beforeAll(() => {
    context = getTestContext()
  })

  describe("when the identity provider exists", () => {
    it("should return 200 with the correct identity provider data", async () => {
      const identityProvider = await context.data.createIdentityProvider()

      const response = await request(context.server)
        .get(`/admin/identity-providers/${identityProvider.id}`)
        .send()

      expect(response.status).toBe(200)
      expect(response).bodyToMatchEntity(identityProvider)
    })
  })

  describe("when the identity provider does not exist", () => {
    it("should return 404", async () => {
      const response = await request(context.server)
        .get(`/admin/identity-providers/${crypto.randomUUID()}`)
        .send()

      expect(response.status).toBe(404)
    })
  })
})
