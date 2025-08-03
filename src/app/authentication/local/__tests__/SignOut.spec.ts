import request from "supertest"
import { getTestContext, TestContext } from "@test/integration/TestContext"
import { setupSupertestMatchers } from "@test/matchers/supertest"

// Set up the custom matchers for this test file
setupSupertestMatchers()

describe("[POST] /auth/local/sign-out", () => {
  let context: TestContext

  beforeAll(() => {
    context = getTestContext()
  })

  it("should return 204 when a valid cookie exists", async () => {
    const user = await context.data.createUser()
    const session = await context.data.createSession({ userId: user.id }, 1)
    const cookie = context.data.createAuthSessionCookie(session)

    const response = await request(context.server)
      .post("/auth/local/sign-out")
      .set("Cookie", [`auth-session=${cookie}`])
      .send()

    expect(response).toHaveStatus(204)
  })

  it("should return 401 when session is already terminated", async () => {
    const user = await context.data.createUser()
    const session = await context.data.createSession({ userId: user.id }, 1)
    const cookie = context.data.createAuthSessionCookie(session)

    await request(context.server)
      .post("/auth/local/sign-out")
      .set("Cookie", [`auth-session=${cookie}`])
      .send()

    const response = await request(context.server)
      .post("/auth/local/sign-out")
      .set("Cookie", [`auth-session=${cookie}`])
      .send()

    expect(response).toHaveStatus(401)
  })

  it("should return 401 when no cookie exists", async () => {
    const response = await request(context.server)
      .post("/auth/local/sign-out")
      .send()

    expect(response).toHaveStatus(401)
  })
})

