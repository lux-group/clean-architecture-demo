# Development Guide: Domain Repository

Repositories abstract persistence for domain entities. Define the interface in the domain and provide implementations in infrastructure (Prisma for Postgres; Redis decorator for caching). Register both in DI.

## Interface (domain)

- File: `src/domain/repositories/MyEntityRepository.ts`
- Extend the base `Repository<T>` and add entity-specific queries

```ts
import { Repository } from "~/domain/repositories/Repository"
import { MyEntity } from "~/domain/entities"

export interface MyEntityRepository extends Repository<MyEntity> {
  tryGetByName(name: string): Promise<MyEntity | undefined>
}
```

## Prisma implementation (Postgres)

- File: `src/infrastructure/repositories/prisma/PrismaMyEntityRepository.ts`
- Map between Prisma models and domain entity
- Enforce unique constraints and optimistic locking (if needed)

```ts
export class PrismaMyEntityRepository implements MyEntityRepository {
  constructor(private readonly prisma: PrismaClient) {}
  async query(options: Query<MyEntity>) { /* ... */ }
  async getById(id: string) { /* ... */ }
  async tryGetById(id: string) { /* ... */ }
  async tryGetByName(name: string) { /* ... */ }
  async insert(entity: MyEntity) { /* ... */ }
  async update(entity: MyEntity) { /* ... */ }
  async delete(entity: MyEntity) { /* ... */ }
}
```

Register in `src/infrastructure/repositories/prisma/module.ts` similarly to:

```ts
container.register({
  myEntityRepository: asClass(PrismaMyEntityRepository).singleton(),
})
```

## Redis decorator

- File: `src/infrastructure/repositories/redis/RedisMyEntityRepository.ts`
- Decorates the base repository to add caching for read paths; delegates writes

```ts
import { RedisRepository } from "~/infrastructure/repositories/redis/RedisRepository"

export class RedisMyEntityRepository
  extends RedisRepository<MyEntity, MyEntityRepository>
  implements MyEntityRepository {
  constructor(redis: RedisClientType, redisDecorated_myEntityRepository: MyEntityRepository) {
    super("my_entity", 3600, redis, decorated)
  }

  /* ... */
}
```

Register as a decorator in `src/infrastructure/repositories/redis/module.ts` using the `decorate(container, name, resolver)` pattern:

```ts
decorate(container, "myEntityRepository", asClass(RedisMyEntityRepository).singleton())
```

## Unit of Work (optional)

When a transactional boundary is required across multiple repositories, use the `UnitOfWork` abstraction (`src/domain/repositories/UnitOfWork.ts`) and the Prisma implementation to execute atomic operations.

## Tests with Testcontainers

- Prisma tests: use `createPrismaTestContext()` from `src/infrastructure/repositories/prisma/__tests__/helpers.ts`.
- Redis tests: use `createRedisTestContext()` from `src/infrastructure/repositories/redis/__tests__/helpers.ts`.

Example Prisma test layout (mirrors existing `PrismaUserRepository.test.ts`):

```ts
import { describe, it, beforeAll, afterAll, expect } from "vitest"
import { createPrismaTestContext } from "./helpers"
import { PrismaMyEntityRepository } from "../PrismaMyEntityRepository"

describe("PrismaMyEntityRepository", () => {
  let ctx: PrismaTestContext
  let repo: PrismaMyEntityRepository

  beforeAll(async () => {
    ctx = await createPrismaTestContext()
    repo = new PrismaMyEntityRepository(ctx.prismaClient)
  })

  afterAll(async () => { await ctx.destroy() })

  it("inserts and fetches", async () => {
    // Arrange + Act + Assert
  })
})
```

Example Redis test layout:

```ts
import { describe, it, beforeAll, afterAll, expect } from "vitest"
import { createRedisTestContext } from "../__tests__/helpers"
import { RedisMyEntityRepository } from "../RedisMyEntityRepository"

describe("RedisMyEntityRepository", () => {
  let ctx: RedisTestContext
  let repo: RedisMyEntityRepository

  beforeAll(async () => {
    ctx = await createRedisTestContext()
    // decorated can be a simple in-memory stub for unit-like tests
    const decorated: MyEntityRepository = /* stub or real */
    repo = new RedisMyEntityRepository(ctx.redisClient, decorated)
  })

  afterAll(async () => { await ctx.destroy() })

  it("caches by id on read", async () => {
    // Arrange read through; Verify second call hits cache (e.g., by spying decorated)
  })
})
```

## DI registration summary

- Prisma: register concrete repositories (`myEntityRepository`)
- Redis: decorate selected repositories by the same DI key (keeps callers unchanged)
