import { randomUUID } from "node:crypto"
import { expect } from "@jest/globals"
import request from "supertest"
import { getTestContext, TestContext } from "@test/integration/internal/support/TestContext"
import { User } from "~/domain/entities"

describe("[POST] /oauth2/token - Client Credentials", () => {
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

  it("should return 401 when user is not a service", async () => {
    const response = await request(context.server)
      .post("/oauth2/token")
      .type('form')
      .send({ grant_type: "client_credentials", client_id: employeeUser.id, client_secret: password })

    expect(response).toHaveStatus(401)
  })

  it("should return 401 when client_id is invalid", async () => {
    const response = await request(context.server)
      .post("/oauth2/token")
      .type('form')
      .send({ grant_type: "client_credentials", client_id: randomUUID(), client_secret: password })

    expect(response).toHaveStatus(401)
  })

  it("should return 401 when client_secret is invalid", async () => {
    const response = await request(context.server)
      .post("/oauth2/token")
      .type('form')
      .send({ grant_type: "client_credentials", client_id: serviceUser.id, client_secret: "invalid" })

    expect(response).toHaveStatus(401)
  })

  it("should return 200 and access token when credentials are valid", async () => {
    const response = await request(context.server)
      .post("/oauth2/token")
      .type('form')
      .send({ grant_type: "client_credentials", client_id: serviceUser.id, client_secret: password })

    expect(response).toHaveStatus(200)
    expect(response.body.access_token).toMatch(/^ey/)
    expect(response.body.expires_in).toBe(3600)
  })
})
