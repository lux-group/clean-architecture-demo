# How to: Write an API Controller
## Introduction
Controllers translate HTTP requests to DTOs and call a handler. They are lightweight and use custom decorators for routing and middleware.

Related ADRs:
- [ADR-007](/docs/adr/007-decorator-based-routing.md) - Decorator-based Routing

## Structure
- Location: `src/app/<feature>/api/<Name>Controller.ts`
- Decorators: `@Controller`, `@Get`, `@Post`, `@Put`, `@Delete`, `@Authorize`
- DI: Register with a key ending in `Controller` (router discovery depends on it)

```ts
@Controller("/admin/users")
export class UserController {
  constructor(private readonly baseUrl: string, private readonly createUserHandler: CreateUserHandler) {}

  @Post("/")
  @Authorize({ scopes: ["users:write"] })
  async create(req: Request, res: Response) {
    const command: CreateUserCommand = { /* parse */ }
    const item = await this.createUserHandler.execute(command)
    res.status(201).header("Location", `${this.baseUrl}/admin/users/${item.id}`).json(this.present(item))
  }
}
```

Register in module:

```ts
container.register({
  userController: asClass(UserController).singleton(),
})
```

Routing assembly uses decorator metadata + DI: see `src/app/decorators.ts` and `createRouterFromDecorators(container)`.

## Querying
The admin APIs support advanced query options.

- parameters `limit` and `offset` for pagination
- parameters `order_by` and optional `order_direction=asc|desc` for sorting
- filtering based on predefined set of fields, e.g. `/users?email=test@host.com`. The value can contain an asterisk at the beginning or end. 

## Testing

- Write API integration tests under `src/app/<module>/__tests__/` using Supertest against the Express app.
- Handlers are exercised through controllers in these tests.
- Each use case (query or command handler) should have a corresponding test. The file must use the extension `.spec.ts` to indicate to the test framework that a containerized environment is required.
- A custom matcher function `bodyToMatchEntity` from `@test/matchers/supertest` can be used to compare API payloads to domain entities.

### Example integration test outline

Use a top-level `describe` that includes the HTTP method, path, and use case name in parentheses. Create a `describe` block for each scenario, with one or more `it` blocks for expected outcomes.

```ts
import "@test/matchers/supertest"
import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import { getTestContext, TestContext } from "@test/integration/TestContext"

describe("[POST] /admin/users (CreateUser)", () => {
  let context: TestContext

  beforeAll(async () => {
    context = await getTestContext()
  })

  describe("when the creation was successful", () => {
    it("returns 201 with the created resource", async () => {
      const response = await request(context.server)
        .post("/admin/users")
        .send({ /* payload */ })
      expect(response.status).toBe(201)
    })

    it("persists the entity", async () => {
      const res = await request(context.server).post("/admin/users").send({ /* payload */ })
      const created = await context.data.getUser(res.body.id)
      expect(res).bodyToMatchEntity(created)
    })
  })

  describe("when input is invalid", () => {
    it("returns 400 with validation details", async () => {
      const response = await request(context.server).post("/admin/users").send({})
      expect(response.status).toBe(400)
    })
  })
})
```

