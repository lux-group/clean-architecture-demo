## Conventions

This document describes the repository-wide naming and structure conventions so humans and AI assistants can mirror patterns reliably. See `README.md` for broader architecture context and rationale.

### AI-Specific Guidelines

**For AI Assistants**: When generating code in this repository:
1. **Always check existing patterns** before creating new code
2. **Use the templates** in `/docs/templates/` for consistency
3. **Follow the naming conventions** exactly as specified below
4. **Generate corresponding tests** for any new functionality
5. **Validate all inputs** using Zod schemas at domain boundaries

### Modules and Registration (DI)
- **Module file**: Each feature area exposes a `module.ts` exporting a default async `registerXxxModule(container)` function (e.g., `registerUserAdminModule`).
- **Registration keys**: Use lowerCamelCase of the class name as the key.
  - **Controllers**: Must end with `Controller` and be registered with keys ending in `Controller` (router discovery depends on this).
    - Example: `UserController` → `userController`.
  - **Handlers**: Must end with `Handler` and be registered with keys ending in `Handler`.
    - Example: `CreateUserHandler` → `createUserHandler`.
- **Lifetimes**: Handlers and controllers are typically `singleton()`. Short-lived workflow components (e.g., `UnitOfWork`) may be `transient()`.
- **Infrastructure**: Register adapters and repositories under descriptive, lowerCamelCase names (e.g., `userRepository`, `tokenIssuer`, `passwordVerifier`).

### Application Layer Structure
- **Folders** inside each feature module under `src/app/...`:
  - `api`: Controllers only. (No business logic.)
  - `jobs`: Scheduled tasks. (No business logic.)
  - `commands`: State-changing use cases.
  - `queries`: Read-only use cases.
  - `events`: Event handlers for domain events.
- **Handler class naming**: `XxxHandler`.
  - One class per file named `XxxHandler.ts`.
  - Public API: `constructor(dependencies...)` and `execute(dto): Promise<Result>`.
- **DTO naming**:
  - Commands: `XxxCommand` (interface or type).
  - Queries: `XxxQuery` (interface).
  - Optional results: `XxxResult` where a non-entity aggregate is returned.
  - Co-locate DTOs with their handler in the same file (exported).
- **Controller usage**:
  - Import handler and its DTO(s) from the handler file.
  - Build DTOs in controllers (basic shaping only) and pass to `handler.execute(dto)`.

### Domain Layer Structure
- **Entities**: Each entity in its own file (`User.ts`, `Session.ts`)
  - Include Zod schema, type definitions, and business logic
  - Use static `createNew()` factory methods
  - Include update methods for mutable entities
- **Repositories**: Interface in domain, implementation in infrastructure
  - Naming: `EntityRepository` (e.g., `UserRepository`)
  - Extend base `Repository<T>` interface
- **Services**: Domain services for cross-entity business logic
  - Naming: `EntityService` (e.g., `AuthenticationService`)
  - Pure business logic, no infrastructure dependencies
- **Events**: Domain events for important business occurrences
  - Naming: `EntityEvent` (e.g., `UserCreatedEvent`)
  - Include relevant entity data and metadata

### Zod Schemas and Validation
- **Domain entities**: Define Zod schemas in the same file as the entity near the top. Export input types via `z.input<typeof schema>` and use `validateProps(schema, props)` when constructing/updating entities.
  - Example placement: `src/domain/entities/User.ts` defines `userSchema` and derives `UserProps`/`CreateUserProps`.
- **Configuration**: Place application configuration schemas under `src/infrastructure/config/schema.ts` and validate at startup.
- **Application layer**: Keep controllers/handlers light on validation. Prefer pushing rules into domain entities/services so rules are enforced consistently.

### Error Handling Conventions

**Domain Errors**:
- Use specific error types: `ValidationError`, `NotFoundError`, `AuthenticationError`
- Include error context and machine-readable codes
- Provide clear, actionable error messages

**Error Structure**:
```typescript
export class DomainError extends Error {
  readonly type = 'DOMAIN_ERROR' as const;
  readonly code: string;
  readonly context?: Record<string, unknown>;
  
  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message)
    this.code = code
    this.context = context
  }
}
```

### File and Type Naming
- **Files**: Match the primary class/type (e.g., `CreateUserHandler.ts`, `GetUserByIdHandler.ts`).
- **Exports** within handler files:
  - `export interface|type XxxCommand | XxxQuery`
  - `export interface|type XxxResult` (when applicable)
  - `export class XxxHandler`
- **Controllers**: `XxxController.ts` in `api/` with decorator-based routes. Must be registered with a key ending in `Controller`.
- **Domain Entities**: `EntityName.ts` (e.g., `User.ts`, `Session.ts`)
- **Repository Interfaces**: `EntityRepository.ts` (e.g., `UserRepository.ts`)
- **Repository Implementations**: `TechnologyEntityRepository.ts` (e.g., `PrismaUserRepository.ts`)

### Import Path Conventions

**Consistent Aliases**:
- `~/domain` for domain imports
- `~/app` for application imports  
- `~/infrastructure` for infrastructure imports
- `~/lib` for shared utilities
- `@test` for test utilities

**Import Order**:
1. Node.js built-ins
2. External libraries
3. Internal imports (using aliases)
4. Relative imports (same directory)

### Testing Conventions

**Test File Naming**:
- Unit tests: `EntityName.test.ts` (same directory as source)
- Integration tests: `FeatureName.spec.ts` in `__tests__` folder

**Test Structure**:
```typescript
describe("Entity/Feature Name", () => {
  // Test data factories
  const createValidProps = () => ({ /* ... */ })
  
  describe("Feature/Method Name", () => {
    it("should successfully handle the happy path", () => {
      // Given: Setup test data
      // When: Execute the operation  
      // Then: Assert expected outcomes
    })
    
    it("should reject invalid input with ValidationError", () => {
      // Given: Invalid input data
      // When/Then: Expect specific error
    })
  })
})
```

### Examples
```ts
// src/app/admin/user/commands/CreateUserHandler.ts
export type CreateUserCommand = { /* ... */ }

export class CreateUserHandler {
  constructor(private readonly userRepository: UserRepository) {}
  async execute(command: CreateUserCommand): Promise<User> { /* ... */ }
}
```

```ts
// src/app/admin/user/module.ts
container.register({
  userController: asClass(UserController).singleton(),
  createUserHandler: asClass(CreateUserHandler).singleton(),
  getUserByIdHandler: asClass(GetUserByIdHandler).singleton(),
})
```

```ts
// src/domain/entities/User.ts
const userSchema = z.object({ /* ... */ })
export type UserProps = Readonly<z.input<typeof userSchema>>
```

### Keep it consistent
When adding new features, mirror existing modules for directory layout, filenames, DI keys, class names, and DTO names. Consistency enables reliable code generation and maintenance.


