import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"
import { IdentityProvider } from "~/domain/entities"

describe("[POST] /auth/external/sign-out-callback (ProcessSignOutResponse)", () => {
  let context: TestContext
  let identityProvider: IdentityProvider

  beforeAll(async () => {
    context = await getTestContext()
    identityProvider = await context.data.createIdentityProvider()
  })

  describe("when the request is valid", () => {
    it("should handle custom sign-in URL", async () => {
      const cookie = context.data.createAuthStateCookie(identityProvider.authSettings!.redirectUrls[0], identityProvider.id)

      const response = await request(context.server)
        .get("/auth/external/sign-out-callback")
        .set("Cookie", [`auth-state=${cookie}`])
        .send()

      expect(response.status).toBe(302)
      expect(response.headers.location).toBe(identityProvider.authSettings!.redirectUrls[0])
    })
  })

  describe("when state is missing", () => {
    it("should return 401 error", async () => {
      const response = await request(context.server)
        .get("/auth/external/sign-out-callback")
        .send()

      expect(response.status).toBe(401)
    })
  })
})

