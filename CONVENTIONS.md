## Conventions

This document describes the repository-wide naming and structure conventions so humans and AI assistants can mirror patterns reliably. See `README.md` for broader architecture context and rationale.

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
  - `api`: Controllers only. No business logic.
  - `commands`: State-changing use cases.
  - `queries`: Read-only use cases.
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

### Zod Schemas and Validation
- **Domain entities**: Define Zod schemas in the same file as the entity near the top. Export input types via `z.input<typeof schema>` and use `validateProps(schema, props)` when constructing/updating entities.
  - Example placement: `src/domain/entities/User.ts` defines `userSchema` and derives `UserProps`/`CreateUserProps`.
- **Configuration**: Place application configuration schemas under `src/infrastructure/config/schema.ts` and validate at startup.
- **Application layer**: Keep controllers/handlers light on validation. Prefer pushing rules into domain entities/services so invariants are enforced consistently.

### File and Type Naming
- **Files**: Match the primary class/type (e.g., `CreateUserHandler.ts`, `GetUserByIdHandler.ts`).
- **Exports** within handler files:
  - `export interface|type XxxCommand | XxxQuery`
  - `export interface|type XxxResult` (when applicable)
  - `export class XxxHandler`
- **Controllers**: `XxxController.ts` in `api/` with decorator-based routes. Must be registered with a key ending in `Controller`.

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


