# Development Guide
## Code Structure
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

## Implementation Guides
| Document | Purpose |
| --- | --- |
| [test-strategy.md](/docs/development-guide/test-strategy.md) | Explains the overall test strategy of the codebase. |
| [dependency-injection.md](/docs/development-guide/dependency-injection.md) | Explains how DI works with Awilix and how to register dependencies. |
| [domain-entity.md](/docs/development-guide/domain-entity.md) | Explains how to implement a new domain entity class. |
| [domain-repository.md](/docs/development-guide/domain-repository.md) | Explains how to implement a new repository. |
| [use-case.md](/docs/development-guide/use-case.md) | Explains how to implement a new command or query handler. |
| [api-controller.md](/docs/development-guide/api-controller.md) | Explains how to implement a new API controller with integration tests. |

### Path Aliases
The `tsconfig.json` file defines two path aliases.
- `~` is an alias for `src` and can be used for `~/app/*`, `~/domain/*`, `~/infrastructure/*`, and `~/lib/*`.
- `@test` is a global alias for test helpers.

## Architecture Decision Records
| ADR | Title | Status |
|-----|-------|--------|
| [ADR-001](/docs/adr/001-clean-architecture-adoption.md) | Adopt Clean Architecture Pattern | Accepted |
| [ADR-002](/docs/adr/002-dependency-injection-with-awilix.md) | Use Awilix for Dependency Injection | Accepted |
| [ADR-003](/docs/adr/003-domain-driven-design-entities.md) | Implement Domain-Driven Design Entities | Accepted |
| [ADR-004](/docs/adr/004-repository-pattern-with-decorators.md) | Repository Pattern with Decorator for Caching | Accepted |
| [ADR-005](/docs/adr/005-zod-for-validation.md) | Use Zod for Schema Validation | Accepted |
| [ADR-006](/docs/adr/006-cqrs-pattern-for-application-services.md) | CQRS Pattern for Application Services | Accepted |
| [ADR-007](/docs/adr/007-decorator-based-routing.md) | Decorator-based Routing | Accepted |
