# Code Structure
## Source Code Folder Hierarchy
| Folder | Responsibility |
| --- | --- |
| 📁 [app](/src/app) | Application use case implementations and triggers (API, scheduled tasks, event subscribers) |
| &nbsp;&nbsp; 📁 \[module] | The app folder is segregated into feature modules.<br/>In most cases, there are two levels. |
| &nbsp;&nbsp; &nbsp;&nbsp; 📁 api | API controllers, routes, presenters, and middleware |
| &nbsp;&nbsp; &nbsp;&nbsp; 📁 events | Event handlers |
| &nbsp;&nbsp; &nbsp;&nbsp; 📁 jobs | Scheduled jobs |
| &nbsp;&nbsp; &nbsp;&nbsp; 📁 commands | Application use case implementations that change state.<br/>They orchestrate business logic in the domain but don't contain business logic. |
| &nbsp;&nbsp; &nbsp;&nbsp; 📁 queries | Application use case implementations that do not change state. |
| 📁 [domain](/src/domain) | The domain (or *core*) contains all the application's business logic.<br/>This project uses [Domain Models](https://aussiecommerce.atlassian.net/wiki/x/FwDx0w) but other [styles](https://aussiecommerce.atlassian.net/wiki/x/EYDp0w) like Transaction Script are also possible. |
| &nbsp;&nbsp; 📁 [adapters](/src/domain/adapters) | Interfaces for infrastructure services used by domain services.<br/>Their implementations can be found in [/infrastructure/adapters](/src/infrastructure/adapters). |
| &nbsp;&nbsp; 📁 [entities](/src/domain/entities) | Domain entities that contain the application's core business structures and rules. |
| &nbsp;&nbsp; 📁 [errors](/src/domain/errors) | Domain errors and common error messages |
| &nbsp;&nbsp; 📁 [events](/src/domain/events) | Domain event messages |
| &nbsp;&nbsp; 📁 [repositories](/src/domain/repositories) | Interfaces for data repositories.<br/>Their implementations can be found in [/infrastructure/repositories](/src/infrastructure/repositories). |
| &nbsp;&nbsp; 📁 [services](/src/domain/services) | Domain services shared by multiple use cases where logic does not fit into an entity. |
| 📁 [infrastructure](/src/infrastructure) | Contains concrete implementations of domain interfaces and technical concerns |
| &nbsp;&nbsp; 📁 [adapters](/src/infrastructure/adapters) | Implements domain adapter interfaces.<br/>(password verification, token validation/issuing, event publishing, etc.) |
| &nbsp;&nbsp; 📁 [auth](/src/infrastructure/auth) | OAuth2 clients for OIDC (Entra ID, Google), Facebook, Apple |
| &nbsp;&nbsp; 📁 [config](/src/infrastructure/config) | Application configuration |
| &nbsp;&nbsp; 📁 [crypto](/src/infrastructure/crypto) | Cryptography utility services |
| &nbsp;&nbsp; 📁 [logging](/src/infrastructure/logging) | Logger - currently just a simple console logger implementation |
| &nbsp;&nbsp; 📁 [repositories](/src/infrastructure/repositories) | Repository implementations with different storage strategies |
| &nbsp;&nbsp; &nbsp;&nbsp; 📁 [memory](/src/infrastructure/repositories/memory) | In-memory repositories for manual local testing. |
| &nbsp;&nbsp; &nbsp;&nbsp; 📁 [prisma](/src/infrastructure/repositories/prisma) | Primary data storage using Prisma ORM |
| &nbsp;&nbsp; &nbsp;&nbsp; 📁 [redis](/src/infrastructure/repositories/redis) | Cache layer decorating Prisma repositories |
| 📁 [lib](/src/lib) | Common utility libraries (no domain logic) |

## Modules
The code is organised into logical modules. Every module has an individual `module.ts` file in its folder that registers all provided services in the Awilix DI container.

## Allowed and disallowed imports

- The `/src/domain` layer must not import modules from the `/src/app` or `/src/infrastructure` layer directly. Instead, it must declare interfaces for all its dependencies which are implemented in `/src/infrastrcuture` and injected into domain services.
- The `/src/app` layer may depend on all other layers.
- The `/src/lib` folder must only contain generic utilities. Never place domain or infrastructure logic into this folder.

## Path aliases
The `tsconfig.json` file defines two path aliases.
- `~` is a generic alias for folder `/src` and can be used for `~/app/*`, `~/domain/*`, `~/infrastructure/*`, and `~/lib/*`.
- `@test` is a global alias for test helpers in folder `/test`.
