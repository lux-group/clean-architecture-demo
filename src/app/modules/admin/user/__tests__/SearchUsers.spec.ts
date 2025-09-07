import "@test/matchers/supertest"
import { getTestContext, TestContext } from "@test/integration/TestContext"
import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { User } from "~/domain/entities"

describe("[GET] /admin/v1/users (SearchUsers)", () => {
  let context: TestContext
  let user: User
  let accessToken: string

  beforeAll(async () => {
    context = await getTestContext()
    user = await context.data.createUser()
    accessToken = await context.createAccessToken(user.id, ["user:read"])
  })

  describe("when users exist", () => {
    it("should return 200 with valid users", async () => {
      const response = await request(context.server)
        .get("/admin/v1/users?offset=0&limit=10")
        .set("Authorization", `Bearer ${accessToken}`)
        .send()

      expect(response.status).toBe(200)
      expect(response.body.total).toBeGreaterThanOrEqual(1)
      expect(response.body.items).toBeInstanceOf(Array)
      expect(response.body.items.length).toBeGreaterThanOrEqual(1)
    })
  })

  it("should return filtered users", async () => {
    const response = await request(context.server)
      .get(`/admin/v1/users?offset=0&limit=10&email=${user.email}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send()

    expect(response.status).toBe(200)
    expect(response.body.total).toBe(1)
    expect(response.body.items.length).toBe(1)
    expect(response.body.items[0].id).toBe(user.id)
  })

  it("should return users with selected fields", async () => {
    const response = await request(context.server)
      .get(`/admin/v1/users?offset=0&limit=10&select=id,email`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send()

    expect(response.status).toBe(200)
    expect(response.body.items.length).toBeGreaterThanOrEqual(1)
    expect(response.body.items[0].id).toBeDefined()
    expect(response.body.items[0].email).toBeDefined()
    expect(response.body.items[0].given_name).toBeUndefined()
    expect(response.body.items[0].surname).toBeUndefined()
  })

  it("should return paginated users", async () => {
    const response = await request(context.server)
      .get(`/admin/v1/users?offset=10000&limit=10`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send()

    expect(response.status).toBe(200)
    expect(response.body.total).toBeGreaterThanOrEqual(1)
    expect(response.body.items.length).toBe(0)
  })

  it("should return sorted users", async () => {
    const response = await request(context.server)
      .get(`/admin/v1/users?offset=0&limit=10&order_by=created_at&order_direction=asc`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send()

    expect(response.status).toBe(200)
  })
  describe("when authorization fails", () => {
    it("should return 401 when no access token is provided", async () => {
      const response = await request(context.server).get("/admin/v1/users?offset=0&limit=10").send()

      expect(response.status).toBe(401)
    })

    it("should return 403 when the access token does not have scope 'users:read'", async () => {
      const nonReadAccessToken = await context.createAccessToken(user.id, ["foo:bar"])

      const response = await request(context.server)
        .get("/admin/v1/users?offset=0&limit=10")
        .set("Authorization", `Bearer ${nonReadAccessToken}`)
        .send()

      expect(response.status).toBe(403)
    })
  })
})
