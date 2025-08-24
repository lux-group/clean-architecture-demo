# How to: Write a Domain Entity
## Introduction
Domain entities encapsulate business rules, validate inputs with Zod, and expose intention-revealing methods. Keep setters private and use factory methods to construct valid instances.

Related ADRs:
- [ADR-003](/docs/adr/003-domain-driven-design-entities.md) - Implement Domain-Driven Design Entities
- [ADR-005](/docs/adr/005-zod-for-validation.md) - Use Zod for Schema Validation

## Structure
- File: `src/domain/entities/MyEntity.ts`
- Co-locate Zod schema and types with the entity
- Validate on construction and on every state change

```ts
import { z } from "zod"
import { Entity, validateProps } from "~/domain/entities/Entity"

const myEntitySchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  name: z.string().min(1),
  isEnabled: z.boolean(),
})

export type MyEntityProps = Readonly<z.input<typeof myEntitySchema>>
export type CreateMyEntityProps = Omit<MyEntityProps, "createdAt" | "updatedAt"> & { id: string }

export class MyEntity extends Entity<MyEntityProps> {
  static createNew(props: CreateMyEntityProps): MyEntity {
    const now = new Date()
    const allProps: MyEntityProps = { ...props, createdAt: now, updatedAt: now }
    validateProps(myEntitySchema, allProps)
    return new MyEntity(allProps)
  }

  constructor(props: MyEntityProps) {
    super(props)
  }

  rename(name: string) {
    const allProps: MyEntityProps = { ...this.props, name, updatedAt: new Date() }
    validateProps(myEntitySchema, allProps)
    this.props = allProps
  }
}
```

## Unit tests

- File: `src/domain/entities/MyEntity.test.ts`
- Cover construction, invariants, and mutation methods.

```ts
import { describe, it, expect } from "vitest"
import { MyEntity } from "./MyEntity"

describe("MyEntity", () => {
  it("creates new with defaults", () => {
    const e = MyEntity.createNew({ id: "1", name: "X", isEnabled: true })
    expect(e.name).toBe("X")
  })

  it("rejects empty name", () => {
    expect(() => MyEntity.createNew({ id: "1", name: "", isEnabled: true })).toThrow()
  })
})
```

## Best practices
- Keep behavior with data; avoid anemic models
- Express clear intent in method names (e.g. `addIdentity`, `disable`, `rename`, `updateProfile`) instead of setters
- Make invalid states unrepresentable via schemas/types
- Throw domain-specific errors with clear codes and context
- Avoid leaking persistence concerns into entities

