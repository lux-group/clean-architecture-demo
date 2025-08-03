import request from "supertest"
import { getTestContext, TestContext } from "@test/integration/TestContext"
import { setupSupertestMatchers } from "@test/matchers/supertest"
import { User } from "~/domain/entities"

setupSupertestMatchers()

describe("[POST] /oauth2/token - Active Session", () => {
  let context: TestContext
  let user: User

  beforeAll(async () => {
    context = getTestContext()
    user = await context.data.createUser({ })
    await context.data.createSigningKey()
  })

  it("should return 401 when no cookie exists", async () => {
    const response = await request(context.server)
      .post("/oauth2/token")
      .type('form')
      .send({ grant_type: "urn:ietf:params:oauth:grant-type:luxury-escapes-session-cookie" })

    expect(response).toHaveStatus(401)
  })

  it("should return 401 when the session has expired", async () => {
    const session = await context.data.createSession({ userId: user.id }, -1)
    const cookie = context.data.createAuthSessionCookie(session)

    const response = await request(context.server)
      .post("/oauth2/token")
      .set("Cookie", [`auth-session=${cookie}`])
      .type('form')
      .send({ grant_type: "urn:ietf:params:oauth:grant-type:luxury-escapes-session-cookie" })

    expect(response).toHaveStatus(401)
  })

  it("should return 200 and access token when session and cookie are valid", async () => {
    const session = await context.data.createSession({ userId: user.id }, 1)
    const cookie = context.data.createAuthSessionCookie(session)

    const response = await request(context.server)
      .post("/oauth2/token")
      .set("Cookie", [`auth-session=${cookie}`])
      .type('form')
      .send({ grant_type: "urn:ietf:params:oauth:grant-type:luxury-escapes-session-cookie" })

    expect(response).toHaveStatus(200)
    expect(response.body.access_token).toMatch(/^ey/)
    expect(response.body.expires_in).toBe(3600)
  })

  // Additional test cases can be added here to cover more scenarios
  // - such as invalid grant type, missing parameters, etc.
  // - impersonation
})

