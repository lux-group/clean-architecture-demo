import { getTestContext, TestContext } from "@test/integration/TestContext"
import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { User } from "~/domain/entities"

describe("[POST] /auth/v2/token (GetTokenWithActiveSession)", () => {
  let context: TestContext
  let user: User

  const getTokenClaims = (token: string) => JSON.parse(atob(token.split(".")[1]))

  beforeAll(async () => {
    context = await getTestContext()
    user = await context.data.createUser({ roles: ["employee"] })
    await context.data.createSigningKey()
  })

  describe("when no session cookie exists", () => {
    it("should return 401", async () => {
      const response = await request(context.server)
        .post("/auth/v2/token")
        .type("form")
        .send({ grant_type: "urn:ietf:params:oauth:grant-type:luxury-escapes-session-cookie" })

      expect(response.status).toBe(401)
      expect(response.body.error).toBe("unauthorized_client")
    })
  })

  describe("when the session has expired", () => {
    it("should return 401", async () => {
      const session = await context.data.createSession({ userId: user.id }, -1)
      const cookie = context.data.createAuthSessionCookie(session)

      const response = await request(context.server)
        .post("/auth/v2/token")
        .set("Cookie", [`auth-session=${cookie}`])
        .type("form")
        .send({ grant_type: "urn:ietf:params:oauth:grant-type:luxury-escapes-session-cookie" })

      expect(response.status).toBe(401)
      expect(response.body.error).toBe("unauthorized_client")
    })
  })

  describe("when session and cookie are valid", () => {
    it("should return 200 and access token", async () => {
      const session = await context.data.createSession({ userId: user.id }, 1)
      const cookie = context.data.createAuthSessionCookie(session)

      const response = await request(context.server)
        .post("/auth/v2/token")
        .set("Cookie", [`auth-session=${cookie}`])
        .type("form")
        .send({ grant_type: "urn:ietf:params:oauth:grant-type:luxury-escapes-session-cookie" })

      expect(response.status).toBe(200)
      expect(response.body.expires_in).toBe(3600)
      expect(response.body.access_token).toMatch(/^ey/)

      const claims = getTokenClaims(response.body.access_token)
      expect(claims.sub).toBe(user.id)
      expect(claims.roles).toEqual(["employee"])
    })
  })

  describe("when impersonating another user", () => {
    it("should return 200 and access token with impersonation claims (V1)", async () => {
      const session = await context.data.createSession({ userId: user.id }, 1)
      const cookie = context.data.createAuthSessionCookie(session)

      const userToImpersonate = await context.data.createUser({ roles: [] })

      const response = await request(context.server)
        .post("/auth/v2/token")
        .set("Cookie", [`auth-session=${cookie}`])
        .type("form")
        .send({
          grant_type: "urn:ietf:params:oauth:grant-type:luxury-escapes-session-cookie",
          subject_to_impersonate_id: userToImpersonate.id,
          access_token_version: "1.0",
        })

      expect(response.status).toBe(200)

      const claims = getTokenClaims(response.body.access_token)
      expect(claims.sub).toBe(userToImpersonate.id)
      expect(claims.aud).toBe(user.id)
    })

    it("should return 200 and access token with impersonation claims (V2)", async () => {
      const session = await context.data.createSession({ userId: user.id }, 1)
      const cookie = context.data.createAuthSessionCookie(session)

      const userToImpersonate = await context.data.createUser({ roles: [] })

      const response = await request(context.server)
        .post("/auth/v2/token")
        .set("Cookie", [`auth-session=${cookie}`])
        .type("form")
        .send({
          grant_type: "urn:ietf:params:oauth:grant-type:luxury-escapes-session-cookie",
          subject_to_impersonate_id: userToImpersonate.id,
          access_token_version: "2.0",
        })

      expect(response.status).toBe(200)

      const claims = getTokenClaims(response.body.access_token)
      expect(claims.sub).toBe(userToImpersonate.id)
      expect(claims.impersonated_by_sub).toBe(user.id)
    })
  })
})
