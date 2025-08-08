import { randomUUID } from "crypto"
import request from "supertest"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { mockAuthClient } from "@test/mocks"
import { getTestContext, TestContext } from "@test/integration/TestContext"
import { IdentityProvider } from "~/domain/entities"

describe("[POST] /auth/external/sign-in-callback (ProcessSignInResponse)", () => {
  let context: TestContext
  let identityProvider: IdentityProvider

  beforeAll(async () => {
    context = await getTestContext()
    identityProvider = await context.data.createIdentityProvider()
  })

  beforeEach(() => {
    const authClientFactory = context.container.resolve("authClientFactory")
    vi.spyOn(authClientFactory, "createClient").mockReturnValue(mockAuthClient)
    vi.clearAllMocks()
  })

  describe("when the external sign-in response is valid", () => {
    it("should auto-create new user after successful sign-in", async () => {
      const cookie = context.data.createAuthStateCookie(identityProvider.authSettings!.redirectUrls[0], identityProvider.id)

      mockAuthClient.processSignInResponse = vi.fn().mockImplementation(() => Promise.resolve({
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

      expect(response.status).toBe(302)
      expect(response.headers.location).toBe(identityProvider.authSettings?.redirectUrls[0])
      expect(response.headers["set-cookie"]).toEqual(expect.arrayContaining([
        expect.stringMatching(/auth-session=.*HttpOnly; Secure; SameSite=Strict/)
      ]))
    })

    it("should auto-link existing user after successful sign-in", async () => {
      const user = await context.data.createUser({ email: `${randomUUID()}@example.com` })
      const cookie = context.data.createAuthStateCookie(identityProvider.authSettings!.redirectUrls[0], identityProvider.id)
      const identifierClaimValue = randomUUID()

      mockAuthClient.processSignInResponse = vi.fn().mockImplementation(() => Promise.resolve({
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

      expect(response.status).toBe(302)
      expect(response.headers.location).toBe(identityProvider.authSettings?.redirectUrls[0])
      expect(response.headers["set-cookie"]).toEqual(expect.arrayContaining([
        expect.stringMatching(/auth-session=.*HttpOnly; Secure; SameSite=Strict/)
      ]))

      const updatedUser = await context.data.getUser(user.id)
      expect(updatedUser.identities).toHaveLength(1)
      expect(updatedUser.identities[0].identityProviderId).toBe(identityProvider.id)
      expect(updatedUser.identities[0].identifierClaimValue).toBe(identifierClaimValue)
    })
  })

  describe("when the user is disabled", () => {
    it("should return error when user is disabled", async () => {
      const user = await context.data.createUser({ email: `${randomUUID()}@example.com`, isEnabled: false })
      const cookie = context.data.createAuthStateCookie(identityProvider.authSettings!.redirectUrls[0], identityProvider.id)

      mockAuthClient.processSignInResponse = vi.fn().mockImplementation(() => Promise.resolve({
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

      expect(response.status).toBe(302)
      expect(response.headers.location).toMatch(/error=Authentication%20method%20is%20not%20allowed/)
      expect(response.headers["set-cookie"]).toEqual(expect.arrayContaining([
        expect.stringMatching(/auth-state=;/)
      ]))
    })
  })

  describe("when user exists and is linked to identity provider", () => {
    it("should sign in successfully", async () => {
      const user = await context.data.createUser({ email: `${randomUUID()}@example.com` })
      const identifierClaimValue = randomUUID()
      
      // Add identity to the user by getting it from the database and updating it
      const userToUpdate = await context.data.getUser(user.id)
      userToUpdate.addIdentity(identityProvider.id, identifierClaimValue)
      const userRepository = context.container.resolve("userRepository")
      await userRepository.update(userToUpdate)
      
      const cookie = context.data.createAuthStateCookie(identityProvider.authSettings!.redirectUrls[0], identityProvider.id)

      mockAuthClient.processSignInResponse = vi.fn().mockImplementation(() => Promise.resolve({
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

      expect(response.status).toBe(302)
      expect(response.headers.location).toBe(identityProvider.authSettings?.redirectUrls[0])
      expect(response.headers["set-cookie"]).toEqual(expect.arrayContaining([
        expect.stringMatching(/auth-session=.*HttpOnly; Secure; SameSite=Strict/)
      ]))
    })
  })

  describe("when state is invalid", () => {
    it("should return 401 error", async () => {
      const response = await request(context.server)
        .get("/auth/external/sign-in-callback")
        .set("Cookie", [`auth-state=invalid-state`])
        .send()

      expect(response.status).toBe(401)
    })
  })

  describe("when state is missing", () => {
    it("should return 401 error", async () => {
      const response = await request(context.server)
        .get("/auth/external/sign-in-callback")
        .send()

      expect(response.status).toBe(401)
    })
  })
})

