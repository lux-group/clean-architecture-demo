# How to: Write API Endpoints

## Introduction

API endpoints are organised by feature rather than artifact type. Each endpoint has its own file containing the handler factory, schema, and types. Routes are registered explicitly in a `routes.ts` file.

Related ADRs:
- [ADR-007](/docs/adr/007-decorator-based-routing.md) - Decorator-based Routing (superseded by feature-based routing)

## Structure

Each feature folder contains:
- `routes.ts` - Route registration using `RouterAbstraction`
- `shared.ts` - Shared schema and presentation mapper (optional)
- `<action>.ts` - One file per endpoint (e.g., `createUser.ts`, `getUserById.ts`)
- `<action>.spec.ts` - Co-located integration tests

### File naming conventions

- Use camelCase for endpoint files: `createUser.ts`, `searchUsers.ts`, `getUserById.ts`
- Use the action/operation name, not HTTP method: `createUser.ts` not `postUser.ts`
- Common patterns: `create<Entity>`, `update<Entity>`, `delete<Entity>`, `get<Entity>ById`, `search<Entities>`

## Endpoint file structure

Each endpoint file exports:
1. A schema object with `request` and `responses` sections
2. A handler factory function that receives dependencies and returns the Express handler

```ts
import type { Request, Response } from 'express';
import z from 'zod';
import type { CreateUserHandler, CreateUserCommand } from '~/application/use-cases/admin/user/CreateUserHandler';
import { MapperBuilder } from '~/lib/MapperBuilder';
import { userSchema, presentUser } from './shared';

export const createUserSchema = {
  request: {
    body: userSchema.omit({
      id: true,
      created_at: true,
      updated_at: true,
    }).extend({
      password: z.string(),
    }),
  },
  responses: {
    201: z.object({
      status: z.literal(201),
      message: z.string(),
      result: userSchema,
    }),
    400: z.object({
      status: z.literal(400),
      message: z.string(),
    }),
  },
};

type RequestBody = z.infer<typeof createUserSchema.request.body>;
type ResponseBody = z.infer<typeof createUserSchema.responses['201']>;

const mapRequestToCommand = MapperBuilder.for<RequestBody>()
  .toCamelCase()
  .build<CreateUserCommand>();

export const createUserHandler = (
  apiCOnfig: ApiConfig,
  createUserHandler: CreateUserHandler,
) => {
  return async (req: Request<unknown, ResponseBody, RequestBody>, res: Response<ResponseBody>) => {
    const command = mapRequestToCommand(req.body);
    const item = await createUserHandler.execute(command);
    res
      .status(201)
      .header('Location', `${apiConfig.host}/${apiConfig.path}/admin/v2/users/${item.id}`)
      .json({
        status: 201,
        message: 'User created',
        result: presentUser(item),
      });
  };
};
```

## Shared file structure

The `shared.ts` file contains the entity schema and presentation mapper:

```ts
import z from 'zod';
import { User } from '~/domain/entities';
import { MapperBuilder } from '~/lib/MapperBuilder';

export const userSchema = z.object({
  id: z.uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  email: z.email().max(255),
  given_name: z.string().min(1).max(50),
  surname: z.string().min(1).max(50),
});

export type UserDto = z.infer<typeof userSchema>;

export const presentUser = MapperBuilder.for<User>()
  .omit('passwordHash')
  .datesToIsoString()
  .toSnakeCase()
  .build<UserDto>();
```

## Routes file structure

The `routes.ts` file registers all routes for the feature:

```ts
import type { RouterAbstraction } from '@luxuryescapes/router';
import { AwilixContainer } from 'awilix';
import { authorizeMiddlewareFactory } from '~/api/middleware/authorize';
import { createUserHandler, createUserSchema } from './createUser';
import { getUserByIdHandler, getUserByIdSchema } from './getUserById';
import { searchUsersHandler, searchUsersSchema } from './searchUsers';

const mount = (container: AwilixContainer, router: RouterAbstraction, basePath: string): void => {
  const authorize = container.build(authorizeMiddlewareFactory);

  router.get({
    url: `${basePath}/admin/v2/users`,
    operationId: 'searchUsers',
    schema: searchUsersSchema,
    preHandlers: [authorize({ scopes: ['user:read', 'user:write'] })],
    handlers: [container.build(searchUsersHandler)],
    summary: 'Search Users',
    description: 'Search for users',
  });

  router.post({
    url: `${basePath}/admin/v2/users`,
    operationId: 'createUser',
    schema: createUserSchema,
    preHandlers: [authorize({ scopes: ['user:write'] })],
    handlers: [container.build(createUserHandler)],
    summary: 'Create User',
    description: 'Create a new user',
  });
};

export default { mount };
```

Key points:
- Handler factories are built via `container.build()` at route registration time
- Authorization middleware is created using `authorizeMiddlewareFactory`
- Each route includes OpenAPI metadata: `operationId`, `summary`, `description`
- No separate `module.ts` file is needed - DI is handled in `routes.ts`

## Response format

All responses follow a standard envelope format:

```ts
{
  status: 200,
  message: 'User found',
  result: { /* entity data */ }
}
```

For list responses:
```ts
{
  status: 200,
  message: '10 Users found',
  result: [ /* array of entities */ ],
  total: 10
}
```

For empty responses (204):
```ts
{
  status: 204,
  message: 'User deleted'
}
```

## Querying

The admin APIs support advanced query options:
- Parameters `limit` and `offset` for pagination
- Parameters `order_by` and optional `order_direction=asc|desc` for sorting
- Filtering based on predefined set of fields, e.g. `/users?email=test@host.com`

## Testing

- Write API integration tests as co-located `.spec.ts` files
- Each endpoint should have a corresponding test file (e.g., `createUser.spec.ts`)
- Tests use Supertest against the Express app

### Example integration test

```ts
import '@test/matchers/supertest';
import { randomUUID } from 'node:crypto';
import { getTestContext, TestContext } from '@test/integration/TestContext';
import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { EventPublisher } from '~/application/ports';

describe('[POST] /admin/v2/users (CreateUser)', () => {
  let context: TestContext;
  let accessToken: string;

  const getPayload = () => ({
    email: `test-${randomUUID()}@example.com`,
    given_name: 'Test',
    surname: 'User',
    brand: 'test-brand',
    password: 'securePassword123',
  });

  beforeAll(async () => {
    context = await getTestContext();
    accessToken = await context.createAccessToken(randomUUID(), ['user:write']);
  });

  describe('when the creation was successful', () => {
    it('should return 201 with valid user', async () => {
      const payload = getPayload();

      const response = await request(context.server)
        .post('/admin/v2/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.result).toEqual(expect.objectContaining({
        email: payload.email,
      }));
    });

    it('should create the user in the database', async () => {
      const payload = getPayload();

      const response = await request(context.server)
        .post('/admin/v2/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload);

      const created = await context.data.getUser(response.body.result.id);
      expect(response).bodyToMatchEntity(created);
    });
  });
});
```
