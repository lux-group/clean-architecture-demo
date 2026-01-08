# Code Conventions

## Tooling

The project uses [Biome](https://biomejs.dev/) for linting and formatting. Check the `biome.json` configuration file for rules.

## Language & Syntax

- **Quotes**: Use single quotes for strings.
- **Semicolons**: Use semicolons at the end of statements.
- **Variables**: Use `const` by default; use `let` when reassignment is required; never use `var`.
- **Line length**: Keep lines under ~120 characters when practical. This is a soft limit—prefer clarity and consistency over strict wrapping.
- **Imports**:
  - Use ES import syntax.
  - Prefer absolute path aliases (e.g., `~/...`) configured in `tsconfig.json`.
  - Order imports logically: Node built-ins (e.g., `node:crypto`), third-party, then internal modules.
  - Use `type` imports for type-only imports (e.g., `import type { User } from '~/domain/entities'`).
- **Exports**: Prefer named exports. Avoid default exports except for route modules.
- **Async/await**: Prefer `async/await` over promise chains.

## TypeScript Practices

- **Strictness**: The project uses `"strict": true`. Avoid `any` where possible.
- **Public APIs**: Explicitly annotate exported/public function signatures where it helps readability.
- **Type aliases**: Use `type` for object shapes; use `Readonly<>` for immutable data.
- **Validation**: Use `zod` schemas for API request/response validation; derive types from schemas.

## Naming & Structure

- **Files**:
  - Endpoint files use camelCase: `createUser.ts`, `getUserById.ts`, `searchUsers.ts`
  - Use-case files use PascalCase: `CreateUser.ts`, `GetUserById.ts`
  - Utilities use camelCase: `parseQuery.ts`, `SecureCookieManager.ts`
- **Directories**: Feature folders use kebab-case (e.g., `identity-provider`, `auth-external`).
- **Handlers**: CQRS handlers are functions; inject with DI and call directly.
- **Routes**: Route files are named `routes.ts` and export a `{ mount }` object.
- **Shared**: Shared schemas and mappers go in `shared.ts`.

## API Endpoints

- **One file per endpoint**: Each operation (create, read, update, delete) has its own file.
- **Schema and handler together**: Each endpoint file exports both the schema and handler factory.
- **Response envelope**: All responses use `{ status, message, result }` format.
- **Co-located tests**: Test files use `.spec.ts` suffix and sit next to implementation files.

```ts
// Endpoint file structure (excerpt)
import type { Request, Response } from 'express';
import z from 'zod';
import type { CreateUser, CreateUserCommand } from '~/application/use-cases/admin/user/CreateUser';
import { userSchema } from './shared';

export const createUserSchema = {
  request: { body: z.object({ /* ... */ }) },
  responses: {
    201: z.object({ status: z.literal(201), message: z.string(), result: userSchema }),
  },
};

export const createUserHandler = (createUser: CreateUser) => {
  return async (req: Request<unknown, any, CreateUserCommand>, res: Response) => {
    const created = await createUser(req.body);
    res.status(201).json({ status: 201, message: 'User created', result: created });
  };
};
```

## Domain Layer

- **Purity**: Keep the domain layer free of dependencies on infrastructure, API, and frameworks.
- **Domain Entities**:
  - Define as `Readonly<>` types with a companion object containing static methods.
  - Use factory methods (e.g., `createNew`) for creation.
  - Return new instances from mutation methods (immutable updates).
  - Validate invariants and throw domain-specific errors.
- **Domain events**:
  - Use dedicated event classes with clear `topic`, `id`, `timestamp`, `result`, and `details` fields.
  - Provide event-specific static factory methods for common scenarios.
- **Domain services**:
  - Keep functions pure and without dependencies on infrastructure services.

## Application Layer

- **Handler patterns**: Prefer functional factory pattern for use cases (no classes).
- **Thin orchestration**: Handlers orchestrate domain logic but don't contain business rules.
- **CQRS**: Separate commands (state changes) and queries (reads) into distinct handlers.

## API Layer

- **Feature-based organisation**: Group endpoints by feature, not by artifact type.
- **Explicit routing**: Use `routes.ts` with `RouterAbstraction` for route registration.
- **Handler factories**: Handler functions are factories that receive dependencies and return Express handlers.
- **Authorization**: Use `authorizeMiddlewareFactory` for scope-based authorization.

## Infrastructure Layer

- **Repositories**:
  - Implement repositories per backing store (Prisma, Redis, Memory).
  - Keep mapping logic in private methods. Do not leak persistence types into the domain.
- **Adapters**: Keep external integrations behind adapter interfaces defined in the application layer.

## Formatting

- **Indentation & spacing**: Two-space indentation.
- **Object/array literals**: Format multi-line literals with one property per line when it improves readability.
- **Arrow functions**: Use concise arrow function syntax for simple handlers.
- **Trailing commas**: Use trailing commas in multi-line arrays and objects.

## Error Handling

- **Domain errors**: Throw domain-specific errors (e.g., `InvalidOperationError`, `NotFoundError`, `AuthenticationError`).
- **HTTP mapping**: Map errors to responses in middleware rather than inside handlers.
- **No silent catches**: Do not catch and ignore errors; handle or propagate them.

## Miscellaneous

- **Node built-ins**: Import via the `node:` scheme (e.g., `node:crypto`).
- **Dates**: Use `Date` for timestamps; favor passing timestamps explicitly for testability.
- **Immutability**: Prefer immutable updates (`{ ...obj, changed }`, array spreads).

If you encounter an area not covered here, match the prevailing style in the surrounding code and keep changes minimal and consistent.
