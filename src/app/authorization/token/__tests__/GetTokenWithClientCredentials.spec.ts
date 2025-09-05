import { randomUUID } from "node:crypto"
import { getTestContext, TestContext } from "@test/integration/TestContext"
import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { User } from "~/domain/entities"

describe("[POST] /oauth2/token (GetTokenWithClientCredentials)", () => {
  let context: TestContext
  let employeeUser: User
  let serviceUser: User
  const password = "foo@bar01"

  beforeAll(async () => {
    context = await getTestContext()
    employeeUser = await context.data.createUser({ password, roles: ["employee"] })
    serviceUser = await context.data.createUser({ password, roles: ["service"] })
    await context.data.createSigningKey()
  })

  describe("when user is not a service", () => {
    it("should return 401", async () => {
      const response = await request(context.server)
        .post("/oauth2/token")
        .type("form")
        .send({ grant_type: "client_credentials", client_id: employeeUser.id, client_secret: password })

      expect(response.status).toBe(401)
      expect(response.body.error).toBe("unauthorized_client")
    })
  })

  describe("when client_id is invalid", () => {
    it("should return 401", async () => {
      const response = await request(context.server)
        .post("/oauth2/token")
        .type("form")
        .send({ grant_type: "client_credentials", client_id: randomUUID(), client_secret: password })

      expect(response.status).toBe(401)
      expect(response.body.error).toBe("unauthorized_client")
    })
  })

  describe("when client_secret is invalid", () => {
    it("should return 401", async () => {
      const response = await request(context.server)
        .post("/oauth2/token")
        .type("form")
        .send({ grant_type: "client_credentials", client_id: serviceUser.id, client_secret: "invalid" })

      expect(response.status).toBe(401)
      expect(response.body.error).toBe("unauthorized_client")
    })
  })

  describe("when credentials are valid", () => {
    it("should return 200 and access token", async () => {
      const response = await request(context.server)
        .post("/oauth2/token")
        .type("form")
        .send({ grant_type: "client_credentials", client_id: serviceUser.id, client_secret: password })

      expect(response.status).toBe(200)
      expect(response.body.access_token).toMatch(/^ey/)
      expect(response.body.expires_in).toBe(3600)
    })
  })
})
