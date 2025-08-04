import "@test/matchers/supertest"
import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"

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

    expect(response.status).toBe(204)
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

    expect(response.status).toBe(401)
  })

  it("should return 401 when no cookie exists", async () => {
    const response = await request(context.server)
      .post("/auth/local/sign-out")
      .send()

    expect(response.status).toBe(401)
  })
})

