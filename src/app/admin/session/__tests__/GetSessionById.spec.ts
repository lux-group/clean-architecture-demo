import "@test/matchers/supertest"
import { randomUUID } from "node:crypto"
import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"

describe("[GET] /admin/sessions/:id (GetSessionById)", () => {
  let context: TestContext
  let accessToken: string

  beforeAll(async () => {
    context = await getTestContext()
    accessToken = await context.data.createAccessToken(randomUUID(), ["session:read"])    
  })

  describe("when the session exists", () => {
    it("should return 200 with the correct session data", async () => {
      const user = await context.data.createUser()
      const session = await context.data.createSession({ userId: user.id }, 24)

      const response = await request(context.server)
        .get(`/admin/sessions/${session.id}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send()

      expect(response.status).toBe(200)
      expect(response).bodyToMatchEntity(session)
    })
  })

  describe("when the session does not exist", () => {
    it("should return 404", async () => {
      const response = await request(context.server)
        .get(`/admin/sessions/${randomUUID()}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send()

      expect(response.status).toBe(404)
    })
  })

  describe("when authorization fails", () => {
    it("should return 401 when no access token is provided", async () => {
      const user = await context.data.createUser()
      const session = await context.data.createSession({ userId: user.id }, 24)

      const response = await request(context.server)
        .get(`/admin/sessions/${session.id}`)
        .send()

      expect(response.status).toBe(401)
    })

    it("should return 403 when the access token does not have scope 'sessions:read'", async () => {
      const user = await context.data.createUser()
      const session = await context.data.createSession({ userId: user.id }, 24)
      const nonReadAccessToken = await context.data.createAccessToken(user.id, ["foo:bar"]) 

      const response = await request(context.server)
        .get(`/admin/sessions/${session.id}`)
        .set("Authorization", `Bearer ${nonReadAccessToken}`)
        .send()

      expect(response.status).toBe(403)
    })
  })
})
