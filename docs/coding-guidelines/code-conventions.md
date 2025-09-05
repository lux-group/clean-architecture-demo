# Code Conventions
## Tooling
The project uses [Biome](https://biomejs.dev/) for lintig and formatting. Check the `biome.json` configuration file for rules.

## Language & Syntax
- **Quotes**: Use double quotes for strings.
- **Semicolons**: Do not use semicolons; rely on ASI (Auto Semi-colon Insertion).
- **Variables**: Use `const` by default; use `let` when reassignment is required; never use `var`.
- **Line length**: Keep lines under ~120 characters when practical. This is a soft limit—prefer clarity and consistency over strict wrapping.
- **Imports**:
  - Use ES import syntax.
  - Prefer absolute path aliases (e.g., `~/...`) configured in `tsconfig.json`.
  - Order imports logically: Node built-ins (e.g., `node:crypto`), third-party, then internal modules.
- **Exports**: Prefer named exports. Avoid default exports for shared types/classes.
- **Async/await**: Prefer `async/await` over promise chains.

## TypeScript Practices
- **Strictness**: The project uses `"strict": true`. Avoid `any` where possible.
- **Public APIs**: Explicitly annotate exported/public function signatures and class constructor parameters where it helps readability. Allow local inference for trivial cases.
- **Type aliases**: Use `type` or `interface` where appropriate; use `readonly` for values that should not change.
- **Validation**: Use `zod` schemas for input and entity validation; derive types from schemas where helpful.

## Naming & Structure
- **Files & Classes**:
  - Classes, entities, repositories, controllers, and handlers use PascalCase file names (e.g., `UserController.ts`, `PrismaUserRepository.ts`).
  - Utilities may use camelCase file names (e.g., `parseQuery.ts`).
- **Directories**: Feature and HTTP folders use kebab-case (e.g., `identity-provider`, `well-known`).
- **Enums**: Use PascalCase enum names; enum members use UPPER_SNAKE_CASE when representing constants (e.g., `BASE_PATH`).
- **Handlers**: CQRS handlers end with `Handler` and expose an `execute` method (e.g., `CreateUserHandler`).
- **Modules**: Composition/DI entry points are named `module.ts` within each feature layer.

## Formatting
- **Indentation & spacing**: Match the existing two-space indentation and spacing style in the repository.
- **Object/array literals**: Format multi-line literals with one property per line when it improves readability.
- **Getters**: Use concise one-line getters for simple property access.
- **Chaining**: Break chained calls across lines when they would exceed the soft line length limit.

## Error Handling
- **Domain errors**: Throw domain-specific errors (e.g., `InvalidOperationError`, `NotFoundError`, `AuthenticationError`) rather than generic errors.
- **HTTP mapping**: Map errors to responses in middleware (e.g., `handleClientErrors`, `handleServerErrors`, `handleOAuthErrors`) rather than inside controllers.
- **No silent catches**: Do not catch and ignore errors; handle or propagate them.

## Domain Layer
- **Purity**: Keep the domain layer free of framework dependencies.
- **Entities**:
  - Provide static factory methods (e.g., `createNew`) for creation.
  - Validate invariants with `zod` (`validateProps`) and use immutable updates via object spreads; prefer getters for access.
- **Domain events**:
  - Use dedicated event classes with clear `topic`, `id`, `timestamp`, `result`, and `details` fields.
  - Provide event-specific static factory methods for common scenarios (e.g., `passwordSuccess`, `entityCreated`).

## Application Layer (Controllers & Use Cases)
- **Decorators**: Use decorator-based routing with `@Controller`, `@Get`, `@Post`, `@Put`, `@Delete`, etc.
- **Authorization**: Use `@Authorize` with clearly defined `scopes`.
- **Thin controllers**: Controllers should parse/validate input (using helpers like `parseQuery`) and delegate to command/query handlers.
- **CQRS**: Separate commands and queries into their respective folders with dedicated handlers.

## Infrastructure Layer
- **Repositories**:
  - Implement repositories per backing store (e.g., Prisma, Redis, Memory) with clear mapping helpers (`mapToDomain`, `mapToPrisma`).
  - Keep mapping logic in private methods. Do not leak persistence types into the domain.
  - Use optimistic concurrency where applicable (e.g., `updatedAt` checks).
- **Adapters**: Keep external integrations behind adapter interfaces in `domain/adapters` and provide concrete implementations in `infrastructure`.

## Miscellaneous
- **Node built-ins**: Import via the `node:` scheme (e.g., `node:crypto`).
- **Dates**: Use `Date` for timestamps; favor passing timestamps explicitly to event factories when meaningful.
- **Immutability**: Prefer immutable updates (`{ ...obj, changed }`, array spreads) to in-place mutation.

If you encounter an area not covered here, match the prevailing style in the surrounding code and keep changes minimal and consistent.


