# ADR-006: CQRS Pattern for Application Services

## Status
Accepted

## Context
When designing the application services layer, we considered two primary approaches:

1. **Unified Handlers**: Single handler pattern that doesn't distinguish between read and write operations
2. **CQRS (Command Query Responsibility Segregation)**: Separate handlers for commands (writes) and queries (reads)

The choice needed to support:
- Future scalability and performance optimization
- Flexibility to adopt different data access patterns
- Maintainable and testable code structure

Traditional unified handlers can lead to:
- Mixed responsibilities in single classes
- Difficulty optimizing read vs write operations separately
- Limited flexibility for future architectural changes
- Potential coupling between read and write data models

## Decision
We will adopt **CQRS (Command Query Responsibility Segregation)** for our application services with the following structure:

```
src/app/{module}/
├── commands/
│   ├── CreateEntityHandler.ts
│   ├── UpdateEntityHandler.ts
│   └── DeleteEntityHandler.ts
└── queries/
    ├── GetEntityByIdHandler.ts
    └── SearchEntitiesHandler.ts
```

Key principles:
- **Commands**: Handle write operations (create, update, delete)
- **Queries**: Handle read operations (get, search, list)
- **Clear Separation**: Commands and queries are in separate directories
- **Single Responsibility**: Each handler has one specific purpose
- **Domain Layer Integration**: Commands work through domain entities and business rules
- **Query Flexibility**: Queries can bypass domain layer for optimized reads

## Implementation Details

### Command Handlers
```typescript
export interface CreateUserCommand {
  email: string
  givenName: string
  surname: string
  password: string
}

export class CreateUserHandler {
  async execute(command: CreateUserCommand): Promise<User> {
    // Business logic through domain entities
    const user = User.create(props)
    return await this.userRepository.save(user)
  }
}
```

### Query Handlers
```typescript
export interface GetUserByIdQuery {
  id: string
}

export class GetUserByIdHandler {
  async execute(query: GetUserByIdQuery): Promise<User> {
    // Direct repository access for reads
    return await this.userRepository.getById(query.id)
  }
}
```

## Consequences

### Positive
- **Separation of Concerns**: Clear distinction between read and write operations
- **Performance Optimization**: Queries can be optimized independently from commands
- **Future Flexibility**: Can easily introduce read-optimized data stores (e.g., read replicas, denormalized views)
- **Scalability**: Different scaling strategies for reads vs writes
- **Testability**: Easier to test read and write logic separately
- **AI-Friendly**: Well-known pattern that AI assistants understand
- **Domain Protection**: Commands go through domain layer, ensuring business rules
- **Query Efficiency**: Queries can bypass domain layer for performance

### Negative
- **Code Duplication**: More handler classes compared to unified approach
- **Complexity**: Additional directory structure and file organization
- **Learning Curve**: Team needs to understand CQRS principles
- **Overhead**: More files to maintain for simple CRUD operations

## Future Considerations

### Read Store Optimization
The CQRS pattern provides flexibility for future architectural enhancements:

```typescript
// Future: Optimized read handler with denormalized data
export class SearchUsersHandler {
  constructor(
    private readonly readOptimizedRepository: UserReadRepository // Different from write repository
  ) {}

  async execute(query: SearchUsersQuery): Promise<SearchUsersResult> {
    // Query denormalized/optimized read store
    return await this.readOptimizedRepository.search(query)
  }
}
```

### Event Sourcing Integration
Commands naturally align with event sourcing patterns:

```typescript
export class CreateUserHandler {
  async execute(command: CreateUserCommand): Promise<User> {
    const user = User.create(props)
    const events = user.getUncommittedEvents()
    
    await this.eventStore.saveEvents(events)
    await this.eventPublisher.publishEvents(events)
    
    return user
  }
}
```

## Implementation Guidelines

### Command Handlers
- Always validate input through domain entities
- Enforce business rules and invariants
- Publish domain events for side effects
- Return domain entities or value objects
- Handle transactions and concurrency

### Query Handlers
- Focus on data retrieval efficiency
- Can bypass domain layer for performance
- Return DTOs optimized for specific use cases
- Implement pagination and filtering
- Cache results when appropriate

### Directory Structure
- Group by feature/module first, then by command/query
- Use descriptive handler names (e.g., `CreateUserHandler`, not `UserHandler`)
- Keep command and query interfaces in same file as handlers
- Maintain consistent naming patterns across modules

This decision supports our goal of building a maintainable, scalable application while providing the flexibility to optimize read and write operations independently as the system grows.

### Tests
All command and query handlers should have a corresponding integration test with the same name in the `/../__tests__` folder.

The tests should implement the following structure:

```typescript
describe("[METHOD] /url (UseCaseName)", () => {
  let context: TestContext

  beforeAll(async () => {
    context = await getTestContext()
  })

  describe("when scenario 1", () => {
    it("should result in outcome 1", async () => {
      ...
    })

    it("should result in outcome 2", async () => {
      ...
    })
  })

  describe("when scenario 2", () => {
    it("should result in outcome 1", async () => {
      ...
    })

    it("should result in outcome 2", async () => {
      ...
    })
  })
})
```
