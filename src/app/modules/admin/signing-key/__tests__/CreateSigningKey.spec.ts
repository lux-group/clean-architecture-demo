import "@test/matchers/supertest"
import { getTestContext, TestContext } from "@test/integration/TestContext"
import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"

describe("[POST] /admin/v1/signing-keys (CreateSigningKey)", () => {
  let context: TestContext
  let accessToken: string

  beforeAll(async () => {
    context = await getTestContext()
    accessToken = await context.createAccessToken("admin-user", ["signing-key:write"])
  })

  describe("when the creation was successful", () => {
    it("should return 201 with new signing key", async () => {
      const response = await request(context.server)
        .post("/admin/v1/signing-keys")
        .set("Authorization", `Bearer ${accessToken}`)
        .send()

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty("id")
      expect(response.body).toHaveProperty("created_at")
      expect(response.body).toHaveProperty("updated_at")
      expect(response.body).toHaveProperty("public_key")
      expect(response.headers.location).toMatch(`/admin/v1/signing-keys/${response.body.id}`)
    })
  })

  describe("when authorization fails", () => {
    it("should return 401 when no access token is provided", async () => {
      const response = await request(context.server).post("/admin/v1/signing-keys").send()

      expect(response.status).toBe(401)
    })

    it("should return 403 when the access token does not have scope 'signing-keys:write'", async () => {
      const nonWriteAccessToken = await context.createAccessToken("admin-user", ["signing-key:read"])

      const response = await request(context.server)
        .post("/admin/v1/signing-keys")
        .set("Authorization", `Bearer ${nonWriteAccessToken}`)
        .send()

      expect(response.status).toBe(403)
    })
  })
})
