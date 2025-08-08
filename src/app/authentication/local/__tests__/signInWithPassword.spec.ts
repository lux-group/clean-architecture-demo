import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"
import { User } from "~/domain/entities"

describe("[POST] /auth/local/sign-in (SignInWithPassword)", () => {
  let context: TestContext
  let enabledUser: User
  let disabledUser: User
  const password = "foo@bar01"

  beforeAll(async () => {
    context = await getTestContext()
    enabledUser = await context.data.createUser({ password, isEnabled: true })
    disabledUser = await context.data.createUser({ password, isEnabled: false })
  })

  describe("when credentials are valid", () => {
    it("should return 204 and set session cookie", async () => {
      const response = await request(context.server)
        .post("/auth/local/sign-in")
        .send({ brand: enabledUser.brand, email: enabledUser.email, password })

      expect(response.status).toBe(204)
      expect(response.headers["set-cookie"]).toEqual(expect.arrayContaining([
        expect.stringMatching(/auth-session=.*HttpOnly; Secure; SameSite=Strict/)
      ]))
    })
  })

  describe("when email is invalid", () => {
    it("should return 401", async () => {
      const response = await request(context.server)
        .post("/auth/local/sign-in")
        .send({ brand: enabledUser.brand, email: "invalid@example.com", password })

      expect(response.status).toBe(401)
      expect(response.headers["set-cookie"]).toBeUndefined()
    })
  })

  describe("when password is invalid", () => {
    it("should return 401", async () => {
      const response = await request(context.server)
        .post("/auth/local/sign-in")
        .send({ brand: enabledUser.brand, email: enabledUser.email, password: "invalid" })

      expect(response.status).toBe(401)
      expect(response.headers["set-cookie"]).toBeUndefined()
    })
  })

  describe("when user is disabled", () => {
    it("should return 401", async () => {
      const response = await request(context.server)
        .post("/auth/local/sign-in")
        .send({ brand: disabledUser.brand, email: disabledUser.email, password })

      expect(response.status).toBe(401)
      expect(response.headers["set-cookie"]).toBeUndefined()
    })
  })
})

