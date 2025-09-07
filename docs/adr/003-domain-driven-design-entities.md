# ADR-003: Implement Domain-Driven Design Entities

## Status
Accepted

## Context
We need a way to model complex business logic that goes beyond simple data structures. The domain layer should contain rich business rules and invariants that are enforced consistently across the application to ensure data consistency and security.

Approaches considered:
- **Anemic Domain Model**: Simple data objects with separate service classes
- **Active Record**: Entities with built-in persistence knowledge
- **Domain Model**: Rich entities with business logic, separate from persistence
- **Transaction Script**: Procedural approach with business logic in services

## Decision
We will implement Domain-Driven Design with rich domain entities because:

1. **Business Logic Encapsulation**: Entities contain their own business rules
2. **Invariant Enforcement**: Validation and constraints are always applied
3. **Expressiveness**: Code reads like business requirements
4. **Consistency**: Rules are defined once and reused everywhere
5. **AI-Friendly**: Expressiveness, consistency, and clear patterns for business logic placement support more efficient and reliable AI-support.

## Implementation Pattern
```typescript
// Rich domain entity with business logic
export class User extends Entity<UserProps> {
  // Getters for properties
  get email() { return this.props.email }
  get isEnabled() { return this.props.isEnabled }

  // Factory method with validation
  static createNew(props: CreateUserProps): User {
    validateProps(userSchema, props)
    return new User({
      ...props,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  // Business logic methods
  changePassword(newPassword: string, passwordVerifier: PasswordVerifier): void {
    if (!this.isEnabled) {
      throw InvalidOperationError.userIsNotEnabled(this.id)
    }
    
    const hashedPassword = passwordVerifier.createPasswordHash(newPassword)
    this.updateProps({ passwordHash: hashedPassword })
  }

  disable(): void {
    if (!this.isEnabled) {
      throw InvalidOperationError.userIsNotEnabled(this.id)
    }
    
    this.updateProps({ isEnabled: false })
  }
}
```

## Entity Design Principles

### 1. Encapsulation
- Properties are private, accessed through getters
- Business logic is contained within the entity
- Validation happens at construction and update

### 2. Invariants
- Zod schemas define data structure and basic validation
- Business rules are enforced in methods
- Invalid states are prevented, not just detected

### 3. Factory Methods
- `createNew()` static method for new entity creation
- Generates system fields (ID, timestamps)
- Validates all inputs before construction

### 4. Immutability Preference
- Entities prefer immutable updates where possible
- `updateProps()` method creates new internal state
- Clear separation between reading and writing

## Consequences

### Positive
- **Business Logic Centralization**: Rules defined once, used everywhere
- **Consistency**: Invariants always enforced
- **Expressiveness**: Code communicates business intent clearly
- **Testability**: Business logic easily unit tested
- **AI Understanding**: Clear patterns for business rule placement

### Negative
- **Complexity**: More complex than simple data objects
- **Learning Curve**: Developers need to understand DDD concepts
- **Performance**: May have overhead compared to anemic models
- **Persistence Mapping**: Requires careful ORM configuration

## Integration with Clean Architecture

### Domain Layer
- Entities contain pure business logic
- No dependencies on infrastructure
- Zod schemas for validation
- Domain events for important state changes

### Domain Services
- Encapsulate reusable business logic that does not fit well into domain entities.

### Application Layer
- Orchestrates entity interactions
- Handles cross-entity business flows
- Converts between DTOs and entities

### Infrastructure Layer
- Maps entities to/from database models
- Implements repository interfaces
- Handles persistence concerns

## Validation Strategy

### Schema-Based Validation
```typescript
const userSchema = z.object({
  email: z.email().max(255),
  givenName: z.string().min(1).max(50),
  // ... other fields
})

export type UserProps = Readonly<z.input<typeof userSchema>>
```

### Business Rule Validation
```typescript
enableUser(): void {
  if (this.isEnabled) {
    throw new InvalidOperationError("User is already enabled")
  }
  
  if (this.hasUnresolvedSecurityFlags()) {
    throw new InvalidOperationError("Cannot enable user with security flags")
  }
  
  this.updateProps({ isEnabled: true })
}
```

## Implementation Notes
- Use Zod schemas for structural validation
- Implement business rules in entity methods
- Prefer composition over inheritance
- Use domain events for important state changes
- Keep entities focused on their own concerns
- Never make entities dependant on services or repositories.