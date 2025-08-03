import "@test/matchers/supertest"
import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"

describe("[GET] /admin/identity-providers", () => {
  let context: TestContext

  beforeAll(() => {
    context = getTestContext()
  })

  it("should return 200 with valid identity providers", async () => {
    await context.data.createIdentityProvider()

    const response = await request(context.server)
      .get("/admin/identity-providers?offset=0&limit=10")
      .send()

    expect(response).toHaveStatus(200)
    expect(response.body.offset).toBe(0)
    expect(response.body.limit).toBe(10)
    expect(response.body.items).toBeInstanceOf(Array)
    expect(response.body.items.length).toBeGreaterThan(0)
  })
})
