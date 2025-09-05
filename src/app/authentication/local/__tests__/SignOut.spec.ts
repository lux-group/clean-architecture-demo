import { getTestContext, TestContext } from "@test/integration/TestContext"
import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"

describe("[POST] /auth/local/sign-out (SignOut)", () => {
  let context: TestContext

  beforeAll(async () => {
    context = await getTestContext()
  })

  describe("when a valid session cookie exists", () => {
    it("should return 204", async () => {
      const user = await context.data.createUser()
      const session = await context.data.createSession({ userId: user.id }, 1)
      const cookie = context.data.createAuthSessionCookie(session)

      const response = await request(context.server)
        .post("/auth/local/sign-out")
        .set("Cookie", [`auth-session=${cookie}`])
        .send()

      expect(response.status).toBe(204)
    })
  })

  describe("when session is already terminated", () => {
    it("should return 401", async () => {
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
  })

  describe("when no session cookie exists", () => {
    it("should return 401", async () => {
      const response = await request(context.server).post("/auth/local/sign-out").send()

      expect(response.status).toBe(401)
    })
  })
})
