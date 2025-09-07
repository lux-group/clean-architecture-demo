# Code Structure
## Source Code Folder Hierarchy
| Folder | Responsibility |
| --- | --- |
| 📁 [app](/src/app) | Application use case implementations and triggers (API, scheduled tasks, event subscribers) |
| &nbsp;&nbsp; 📁 [adapters](/src/app/adapters) | Interfaces for infrastructure services used by app services.<br/>Their implementations can be found in the [infrastructure](/src/infrastructure/adapters) folder. |
| &nbsp;&nbsp; 📁 [modules](/src/app/modules) | The app folder is segregated into feature modules.<br/>In most cases, there are two levels. |
| &nbsp;&nbsp; &nbsp;&nbsp; 📁 api | API controllers, routes, presenters, and middleware |
| &nbsp;&nbsp; &nbsp;&nbsp; 📁 events | Event handlers |
| &nbsp;&nbsp; &nbsp;&nbsp; 📁 jobs | Scheduled jobs |
| &nbsp;&nbsp; &nbsp;&nbsp; 📁 commands | Application use case implementations that change state.<br/>They orchestrate business logic in the domain but don't contain business logic. |
| &nbsp;&nbsp; &nbsp;&nbsp; 📁 queries | Application use case implementations that do not change state. |
| &nbsp;&nbsp; 📁 [shared](/src/app/shared) | Shared app components such as common Express middleware. |
| 📁 [domain](/src/domain) | The domain (or *core*) contains all the application's business logic.<br/>This project uses [Domain Models](https://aussiecommerce.atlassian.net/wiki/x/FwDx0w) but other [styles](https://aussiecommerce.atlassian.net/wiki/x/EYDp0w) like Transaction Script are also possible. |
| &nbsp;&nbsp; 📁 [entities](/src/domain/entities) | Domain entities that contain the application's core business structures and rules. |
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

## Modules
The code is organised into logical modules. Every module has an individual `module.ts` file in its folder that registers all provided services in the Awilix DI container.

## Allowed and disallowed imports

- The `/lib` folder must not import any artifacts from another folder.
- The `/domain` layer must not import any artifacts from another layer, except from the `/lib` folder.
- The `/app` layer imports artifacts from the `/domain` layer. It must not import artifacts from `/infrastructure` directly. Instead, it defines interfaces in `/app/adapters` that the infrastructure layer implements and injects.
- The `/infrastructure` layer may import artifacts from all other layers.

## Path aliases
The `tsconfig.json` file defines two path aliases.
- `~` is a generic alias for folder `/src` and can be used for `~/app/*`, `~/domain/*`, `~/infrastructure/*`, and `~/lib/*`.
- `@test` is a global alias for test helpers in folder `/test`.
