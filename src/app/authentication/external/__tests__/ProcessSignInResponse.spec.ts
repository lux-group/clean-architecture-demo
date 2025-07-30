import { randomUUID } from "crypto"
import { expect } from "@jest/globals"
import request from "supertest"
import { getTestContext, TestContext } from "@test/support/TestContext"
import { IdentityProvider } from "~/domain/entities"

describe("[POST] /auth/external/sign-in-callback", () => {
  let context: TestContext
  let identityProvider: IdentityProvider

  beforeAll(async () => {
    context = await getTestContext()
    identityProvider = await context.data.createIdentityProvider({})
  })

  it("should auto-create new user after successful sign-in", async () => {
    const cookie = context.data.createAuthStateCookie(identityProvider.authSettings!.redirectUrls[0], identityProvider.id)

    context.mock.authClientProcessSignInResponse(() => ({
      idToken: "unused",
      refreshToken: "unused",
      accessToken: "unused",
      sessionId: randomUUID(),
      profile: {
        identifierClaimValue: randomUUID(),
        email: `${randomUUID()}@example.com`,
        givenName: randomUUID(),
        surname: randomUUID(),
      }
    }))

    const response = await request(context.server)
      .get("/auth/external/sign-in-callback")
      .set("Cookie", [`auth-state=${cookie}`])
      .send()

    expect(response).toHaveStatus(302)
    expect(response).toHaveCookie("auth-session", ["HttpOnly", "Secure", "SameSite=Strict"])
    expect(response.headers.location).toBe(identityProvider.authSettings?.redirectUrls[0])
  })

  it("should auto-link existing user after successful sign-in", async () => {
    const user = await context.data.createUser({ email: `${randomUUID()}@example.com` })
    const cookie = context.data.createAuthStateCookie(identityProvider.authSettings!.redirectUrls[0], identityProvider.id)
    const identifierClaimValue = randomUUID()

    context.mock.authClientProcessSignInResponse(() => ({
      idToken: "unused",
      refreshToken: "unused",
      accessToken: "unused",
      sessionId: randomUUID(),
      profile: {
        identifierClaimValue,
        email: user.email,
        givenName: randomUUID(),
        surname: randomUUID(),
      }
    }))

    const response = await request(context.server)
      .get("/auth/external/sign-in-callback")
      .set("Cookie", [`auth-state=${cookie}`])
      .send()

    expect(response).toHaveStatus(302)
    expect(response).toHaveCookie("auth-session", ["HttpOnly", "Secure", "SameSite=Strict"])
    expect(response.headers.location).toBe(identityProvider.authSettings?.redirectUrls[0])

    const updatedUser = await context.data.getUser(user.id)
    expect(updatedUser.identities).toHaveLength(1)
    expect(updatedUser.identities[0].identityProviderId).toBe(identityProvider.id)
    expect(updatedUser.identities[0].identifierClaimValue).toBe(identifierClaimValue)
  })

  it("should return error when user is disabled", async () => {
    const user = await context.data.createUser({ email: `${randomUUID()}@example.com`, isEnabled: false })
    const cookie = context.data.createAuthStateCookie(identityProvider.authSettings!.redirectUrls[0], identityProvider.id)

    context.mock.authClientProcessSignInResponse(() => ({
      idToken: "unused",
      refreshToken: "unused",
      accessToken: "unused",
      sessionId: randomUUID(),
      profile: {
        identifierClaimValue: randomUUID(),
        email: user.email,
        givenName: randomUUID(),
        surname: randomUUID(),
      }
    }))

    const response = await request(context.server)
      .get("/auth/external/sign-in-callback")
      .set("Cookie", [`auth-state=${cookie}`])
      .send()

    expect(response).toHaveStatus(302)
    expect(response).notToHaveCookie("auth-session")
    expect(response.headers.location).toMatch(/error=Authentication%20method%20is%20not%20allowed/)
  })

  // More scenarios can be added here:
  // - User exists and linked to identity provider
  // - Invalid state
  // - Invalid session
  // - Missing session
})
