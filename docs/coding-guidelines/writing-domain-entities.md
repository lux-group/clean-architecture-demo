# How to: Write a Domain Entity

## Introduction

Domain entities encapsulate business rules, validate inputs, and expose intention-revealing methods. Entities are defined as immutable TypeScript types with a companion object containing static factory methods and operations.

Related ADRs:
- [ADR-003](/docs/adr/003-domain-driven-design-entities.md) - Implement Domain-Driven Design Entities
- [ADR-005](/docs/adr/005-zod-for-validation.md) - Use Zod for Schema Validation

## Structure

- File: `src/domain/entities/MyEntity.ts`
- Define the entity as a `Readonly<{...}>` type
- Define prop types for creation and updates
- Create a companion object with the same name containing static methods

```ts
import { randomUUID } from 'node:crypto';
import { InvalidOperationError } from '../errors';

export type MyEntity = Readonly<{
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  isEnabled: boolean;
}>;

export type CreateMyEntityProps = Omit<MyEntity, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateMyEntityProps = Omit<MyEntity, 'id' | 'createdAt' | 'updatedAt'>;

export const MyEntity = {
  createNew(props: CreateMyEntityProps, now: Date = new Date()): MyEntity {
    return {
      ...props,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
  },

  update(entity: MyEntity, props: UpdateMyEntityProps, now: Date = new Date()): MyEntity {
    return {
      ...entity,
      ...props,
      updatedAt: now,
    };
  },

  rename(entity: MyEntity, name: string, now: Date = new Date()): MyEntity {
    if (name.length === 0) {
      throw new InvalidOperationError('Name cannot be empty');
    }
    return {
      ...entity,
      name,
      updatedAt: now,
    };
  },

  disable(entity: MyEntity, now: Date = new Date()): MyEntity {
    if (!entity.isEnabled) {
      throw new InvalidOperationError('Entity is already disabled');
    }
    return {
      ...entity,
      isEnabled: false,
      updatedAt: now,
    };
  },
} as const;
```

## Key patterns

### Immutable updates

All operations return a new entity instance rather than mutating the existing one:

```ts
// Good - returns new instance
update(entity: MyEntity, props: UpdateProps): MyEntity {
  return { ...entity, ...props, updatedAt: new Date() };
}

// Bad - mutates in place
update(entity: MyEntity, props: UpdateProps): void {
  entity.name = props.name;  // This won't work with Readonly types anyway
}
```

### Optional timestamp injection

Allow timestamp injection for testability while providing a sensible default:

```ts
createNew(props: CreateProps, now: Date = new Date()): MyEntity {
  return { ...props, createdAt: now, updatedAt: now };
}
```

### Validation in operations

Validate business rules within entity operations and throw domain-specific errors:

```ts
addIdentity(user: User, identityProviderId: string): User {
  if (user.identities.some(i => i.identityProviderId === identityProviderId)) {
    throw InvalidOperationError.duplicateIdentity(user.id, identityProviderId);
  }
  // ... create new identity
}
```

### Query methods

Include pure query methods that don't modify state:

```ts
export const User = {
  fullName(user: User): string {
    return `${user.givenName} ${user.surname}`;
  },

  isServiceAccount(user: User): boolean {
    return user.roles.includes('service');
  },
} as const;
```

## Unit tests

- File: `src/domain/entities/MyEntity.test.ts`
- Cover creation, invariants, and mutation methods

```ts
import { describe, it, expect } from 'vitest';
import { MyEntity } from './MyEntity';

describe('MyEntity', () => {
  const now = new Date('2024-01-01');

  describe('createNew', () => {
    it('creates new entity with defaults', () => {
      const entity = MyEntity.createNew({ name: 'Test', isEnabled: true }, now);

      expect(entity.name).toBe('Test');
      expect(entity.isEnabled).toBe(true);
      expect(entity.createdAt).toBe(now);
      expect(entity.updatedAt).toBe(now);
      expect(entity.id).toBeDefined();
    });
  });

  describe('rename', () => {
    it('updates name and updatedAt', () => {
      const entity = MyEntity.createNew({ name: 'Old', isEnabled: true }, now);
      const later = new Date('2024-01-02');

      const renamed = MyEntity.rename(entity, 'New', later);

      expect(renamed.name).toBe('New');
      expect(renamed.updatedAt).toBe(later);
      expect(renamed.createdAt).toBe(now); // unchanged
    });

    it('rejects empty name', () => {
      const entity = MyEntity.createNew({ name: 'Test', isEnabled: true }, now);

      expect(() => MyEntity.rename(entity, '')).toThrow('Name cannot be empty');
    });
  });

  describe('disable', () => {
    it('throws if already disabled', () => {
      const entity = MyEntity.createNew({ name: 'Test', isEnabled: false }, now);

      expect(() => MyEntity.disable(entity)).toThrow('Entity is already disabled');
    });
  });
});
```

## Best practices

- **Keep behavior with data** — avoid anemic models; put business logic in the entity object
- **Express clear intent** — use method names like `addIdentity`, `disable`, `rename` instead of generic setters
- **Make invalid states unrepresentable** — use TypeScript types to prevent invalid combinations
- **Throw domain-specific errors** — use `InvalidOperationError`, `NotFoundError`, etc. with clear context
- **Avoid leaking persistence concerns** — entities should not know about databases or ORMs
- **Immutable by default** — use `Readonly<>` types and return new instances from operations
- **Testable timestamps** — inject `Date` parameters with defaults for deterministic testing
