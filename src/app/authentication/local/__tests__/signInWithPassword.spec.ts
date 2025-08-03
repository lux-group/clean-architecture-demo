import request from "supertest"
import { getTestContext, TestContext } from "@test/integration/TestContext"
import { setupSupertestMatchers } from "@test/matchers/supertest"
import { User } from "~/domain/entities"

setupSupertestMatchers()

describe("[POST] /auth/local/sign-in", () => {
  let context: TestContext
  let enabledUser: User
  let disabledUser: User
  const password = "foo@bar01"

  beforeAll(async () => {
    context = getTestContext()
    enabledUser = await context.data.createUser({ password, isEnabled: true })
    disabledUser = await context.data.createUser({ password, isEnabled: false })
  })

  it("should return 204 when email and password are valid", async () => {
    const response = await request(context.server)
      .post("/auth/local/sign-in")
      .send({ brand: enabledUser.brand, email: enabledUser.email, password })

    expect(response).toHaveStatus(204)
    expect(response).toHaveCookie("auth-session", ["HttpOnly", "Secure", "SameSite=Strict"])
  })

  it("should return 401 when email is invalid", async () => {
    const response = await request(context.server)
      .post("/auth/local/sign-in")
      .send({ brand: enabledUser.brand, email: "invalid@example.com", password })

    expect(response).toHaveStatus(401)
    expect(response).notToHaveCookie("auth-session")
  })

  it("should return 401 when password is invalid", async () => {
    const response = await request(context.server)
      .post("/auth/local/sign-in")
      .send({ brand: enabledUser.brand, email: enabledUser.email, password: "invalid" })

    expect(response).toHaveStatus(401)
    expect(response).notToHaveCookie("auth-session")
  })

  it("should return 401 when user is disabled", async () => {
    const response = await request(context.server)
      .post("/auth/local/sign-in")
      .send({ brand: disabledUser.brand, email: disabledUser.email, password })

    expect(response).toHaveStatus(401)
    expect(response).notToHaveCookie("auth-session")
  })
})

