# Code Structure

## Source Code Folder Hierarchy

| Folder | Responsibility |
| --- | --- |
| 📁 [api](/src/api) | API layer: Controllers, routes, middleware, and other HTTP-related concerns |
| &nbsp;&nbsp; 📁 [controllers](/src/api/controllers) | Feature-organised endpoints grouped by domain area |
| &nbsp;&nbsp; &nbsp;&nbsp; 📁 [admin](/src/api/controllers/admin) | Admin API endpoints (user, session, signing-key, identity-provider) |
| &nbsp;&nbsp; &nbsp;&nbsp; 📁 [public](/src/api/controllers/public) | Public API endpoints (auth, profile, token) |
| &nbsp;&nbsp; 📁 [middleware](/src/api/middleware) | Express middleware (authorization, error handling, etc.) |
| &nbsp;&nbsp; 📁 [utils](/src/api/utils) | API utilities (query parsing, cookie management, etc.) |
| 📁 [application](/src/application) | Application layer |
| &nbsp;&nbsp; 📁 [ports](/src/application/ports) | Interfaces for infrastructure services used by the application layer.<br/>Their implementations can be found in the [/infrastructure](/src/infrastructure) folder. |
| &nbsp;&nbsp; 📁 [use-cases](/src/application/use-cases) | Application Services. Each service orchestrates the activities of a use case across domain and infrastrcuture services (ports). |
| &nbsp;&nbsp; &nbsp;&nbsp; 📁 [admin](/src/application/use-cases/admin) | Admin use cases (CRUD operations) |
| &nbsp;&nbsp; &nbsp;&nbsp; 📁 [public](/src/application/use-cases/public) | Public use cases (authentication, tokens, profiles) |
| 📁 [domain](/src/domain) | The domain layer (or core) contains all the application's business logic. |
| &nbsp;&nbsp; 📁 [entities](/src/domain/entities) | Domain entities as immutable types with companion objects containing business logic. |
| &nbsp;&nbsp; 📁 [errors](/src/domain/errors) | Domain errors and common error messages |
| &nbsp;&nbsp; 📁 [events](/src/domain/events) | Domain event messages |
| &nbsp;&nbsp; 📁 [repositories](/src/domain/repositories) | Interfaces for data repositories.<br/>Their implementations can be found in [/infrastructure/repositories](/src/infrastructure/repositories). |
| &nbsp;&nbsp; 📁 [services](/src/domain/services) | Domain services shared by multiple use cases where logic does not fit into an entity. |
| 📁 [infrastructure](/src/infrastructure) | Contains concrete implementations of domain interfaces and technical concerns |
| &nbsp;&nbsp; 📁 [auth](/src/infrastructure/auth) | OAuth2 clients for OIDC (Entra ID, Google), Facebook, Apple |
| &nbsp;&nbsp; 📁 [config](/src/infrastructure/config) | Application configuration |
| &nbsp;&nbsp; 📁 [crypto](/src/infrastructure/crypto) | Cryptography utility services |
| &nbsp;&nbsp; 📁 [eventing](/src/infrastructure/eventing) | Pub-Sub eventing infrastructure (internal) |
| &nbsp;&nbsp; 📁 [logging](/src/infrastructure/logging) | Logger - currently just a simple console logger implementation |
| &nbsp;&nbsp; 📁 [repositories](/src/infrastructure/repositories) | Repository implementations with different storage strategies |
| &nbsp;&nbsp; &nbsp;&nbsp; 📁 [memory](/src/infrastructure/repositories/memory) | In-memory repositories for manual local testing. |
| &nbsp;&nbsp; &nbsp;&nbsp; 📁 [prisma](/src/infrastructure/repositories/prisma) | Primary data storage using Prisma ORM |
| &nbsp;&nbsp; &nbsp;&nbsp; 📁 [redis](/src/infrastructure/repositories/redis) | Cache layer decorating Prisma repositories |
| 📁 [lib](/src/lib) | Common utility libraries (no domain logic) |

## Feature folder structure

Each feature folder in `/api/controllers` follows a consistent structure:

```
src/api/controllers/admin/user/
├── routes.ts              # Route registration
├── shared.ts              # Shared schema and presentation mapper
├── createUser.ts          # Create endpoint
├── createUser.spec.ts     # Create endpoint tests
├── getUserById.ts         # Get by ID endpoint
├── getUserById.spec.ts    # Get by ID tests
├── searchUsers.ts         # Search endpoint
├── searchUsers.spec.ts    # Search tests
├── updateUser.ts          # Update endpoint
├── updateUser.spec.ts     # Update tests
├── deleteUser.ts          # Delete endpoint
└── deleteUser.spec.ts     # Delete tests
```

Key characteristics:
- **One file per endpoint** — each operation has its own file
- **Co-located tests** — `.spec.ts` files next to their implementation
- **Explicit route registration** — `routes.ts` mounts all routes using `RouterAbstraction`
- **Shared code in `shared.ts`** — entity schema and presentation mapper

## Modules

The application is organised into logical modules. Route registration happens in `routes.ts` files within each feature folder, which are then mounted by the main API module.

Use case handlers are registered in `module.ts` files within each use-case folder using the Awilix DI container.

## Allowed and disallowed imports

- The `/lib` folder must not import any artifacts from another folder.
- The `/domain` layer must not import any artifacts from another layer, except from the `/lib` folder.
- The `/application` layer imports artifacts from the `/domain` layer. It must not import artifacts from `/infrastructure` directly. Instead, it defines interfaces in `/application/ports` that the infrastructure layer implements and injects.
- The `/api` layer imports from `/application` and `/domain`. It must not import from `/infrastructure`.
- The `/infrastructure` layer may import artifacts from all other layers.

## Path aliases

The `tsconfig.json` file defines two path aliases:
- `~` is a generic alias for folder `/src` and can be used for `~/api/*`, `~/application/*`, `~/domain/*`, `~/infrastructure/*`, and `~/lib/*`.
- `@test` is a global alias for test helpers in folder `/test`.
