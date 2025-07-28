# Introduction
This project started as a POC for [Auth Service V2](https://aussiecommerce.atlassian.net/wiki/x/wQES3g). However, it has evolved into a demo project for [Clean Architecture](https://www.amazon.com.au/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164/ref=pd_bxgy_d_sccl_1/358-2171586-5171204), demonstrating numerous design principles and patterns in action.

# Auth Service V2
### Demonstrated features
- Sign-up, sign-in, and sign-out with Entra ID
  - Front-channel logout
  - Check session state using refresh tokens
  - Extensions called by entra to customize the sign-up flow
- Sign-in with Google
- Local authentication with email and password
- Session management with secure, encrypted, HTTP-only cookies.
- OAuth2 Token endpoint
  - Custom grant to get access token with session cookie
  - Client Credentials grant using user-id and password
  - Token Exchange grant
- OIDC metadata & JWKS endpoints
- Abstraction layer for supporting non-OIDC compliant IDPs like Apple and Facebook with minimal code.
- Profile edit or anonymisation in Entra ID via MS Graph API.
- Authorization with `audience` and `scope` (structure only)
- Audit logging using domain events

### Notes
- The API does not contain much data validation because we already have a framework for that in our standard template.
- Four well-known libraries are used to read, write, and validate JWTs and interact with OIDC providers. There is some overlap between them because the OIDC client contains its own JWT validation. The *TokenValidator.ts* class is only used for the token exchange grant.

# Clean Architecture
### Introduction
The key difference between the traditional layered architecture usually adopted at Luxury Escapes and [Clean Architecture](https://www.amazon.com.au/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164/ref=pd_bxgy_d_sccl_1/358-2171586-5171204) (aka. Onion Architecture, Hexagon Architecture) lies in the direction of dependencies.

In traditional layered architecture, dependencies typically flow downwards - from the core business logic to external layers like database or clients for other APIs.

**In Clean Architecture, all dependencies flow inward, ensuring that the core domain and business rules remain independent of external services, technologies, and interfaces.** This results in components with higher cohesion, less coupling, and clearer separation of concerns.

![Clean Architecture Diagram](https://blog.cleancoder.com/uncle-bob/images/2012-08-13-the-clean-architecture/CleanArchitecture.jpg)

### Layers

| Folder | Responsibility |
| --- | --- |
| 📁 [api](/src/api) | HTTP API presentation layer using Express |
| 📁 [application](/src/application) | Application use case implementations<br/>They orchestrate business logic in the domain but don't contain business logic.<br/>This project implements common handlers for commands and queries but it could also use [CQRS](https://aussiecommerce.atlassian.net/wiki/x/BwC01) |
| 📁 [domain](/src/domain) | The domain (or *core*) contains all the application's business logic.<br/>This project uses [Domain Models](https://aussiecommerce.atlassian.net/wiki/x/FwDx0w) but other [styles](https://aussiecommerce.atlassian.net/wiki/x/EYDp0w) like Transaction Script are also possible. |
| &nbsp;&nbsp; 📁 [adapters](/src/domain/adapters) | Interfaces for infrastructure services used by domain services.<br/>Their implementations can be found in [/infrastructure/adapters](/src/infrastructure/adapters). |
| &nbsp;&nbsp; 📁 [entities](/src/domain/entities) | Domain entities that contain the applications business rules without any dependencies on data stores or external services. |
| &nbsp;&nbsp; 📁 [errors](/src/domain/errors) | Domain errors and common error messages |
| &nbsp;&nbsp; 📁 [events](/src/domain/events) | Domain event messages |
| &nbsp;&nbsp; 📁 [repositories](/src/domain/repositories) | Interfaces for data repositories.<br/>Their implementations can be found in [/infrastructure/repositories](/src/infrastructure/repositories). |
| &nbsp;&nbsp; 📁 [services](/src/application/services) | Domain services shared by multiple use cases where logic does not fit into an entity. |
| 📁 [infrastructure](/src/infrastructure) | Contains the concrete implementation of all interfaces and repositories. |
| &nbsp;&nbsp; 📁 [adapters](/src/infrastructure/adapters) | Domain adapter implementations. |
| &nbsp;&nbsp; 📁 [auth](/src/infrastructure/auth) | OAuth2 Clients for various IDPs - Entra ID and Google (implemented) and Facebook and Apple (Pending) |
| &nbsp;&nbsp; 📁 [config](/src/infrastructure/config) | Application configuration |
| &nbsp;&nbsp; 📁 [crypto](/src/infrastructure/crypto) | Cryptography utility services |
| &nbsp;&nbsp; 📁 [logging](/src/infrastructure/logging) | Logger - currently just a simple console logger implementation |
| &nbsp;&nbsp; 📁 [repositories](/src/infrastructure/repositories) | Domain repository implementations |
| &nbsp;&nbsp; &nbsp;&nbsp; 📁 [memory](/src/infrastructure/repositories/memory) | In-memory repositories |
| &nbsp;&nbsp; &nbsp;&nbsp; 📁 [prisma](/src/infrastructure/repositories/prisma) | Prisma repositories |
| &nbsp;&nbsp; &nbsp;&nbsp; 📁 [redis](/src/infrastructure/repositories/redis) | Pending - Redis caching decorator repositories |
| 📁 [lib](/src/lib) | Common utility libraries (no domain logic) |

## Important Principles & Patterns

### Dependency Inversion
The key to Clean Architecture is the application of the Dependency Inversion principle to make infrastructure dependant on the core (domain) instead of the other way.

The [/domain/adapters](/src/domain/adapters) and [/domain/repositories](/src/domain/repositories) folders contains the interfaces that define the application's infrastructure dependencies. To truly inverse the dependency, it's crucial that these interfaces are written from the domain's point of view. They use domain models and language, not the models and language of the dependency.

It is the responsibility of the adapter and repository implementations in the [/infrastructure](/src/infrastructure) folder to take care of data mapping between the domain model and the external model. This keeps the domain model focused on its main purpose - implement business rules.

### Dependency Injection
To support dependency inversion, the application uses [awilix](https://github.com/jeffijoe/awilix) for dependency injection. The library is non-intrusive and easy to replace or remove. Unlike decorator-based DI containers, awilix works fine with functions and even primitive values. But be aware that it relies on consistent dependency names.

To avoid the usual spaghetti code, global singleton variables like `logger`, `config`, or `prismaClient` no longer exist. These dependencies must now properly be injected where they are used.

```TypeScript
import { Logger } from "~/infrastructure/logging"

class MyService {
  constructor(private readonly logger: Logger) {}
}
```

Note in the example above that `Logger` is just an interface. Awilix will actually inject the `ConsoleLogger` implementation that has been registered for `logger`.
```TypeScript
import { asClass } from "awilix"
import { ConsoleLogger } from "./logging/ConsoleLogger"

container.register({
  logger: asClass(ConsoleLogger).singleton()
})
```

### Domain Model
The [/domain](/src/domain) folder contains the applications's "core" inform of a simple [Domain Model](https://aussiecommerce.atlassian.net/wiki/x/FwDx0w) to encapsulate the business logic, avoid code duplication, to make the code expressive and self-explaining, and to enable easier unit testing.

## Comparison with typical LE Architecture
Pending

## Test Strategy
### Unit Tests
This project demonstrates how clean architecture produces small modules that encapsulate self-contained business or utility logic, characterized by high cohesion and low coupling. This is a critical prerequisite for writing reliable and maintainable unit testing.

This project contains unit tests for:
- API Middleware
- Domain Entities
- Domain Services (pending)
- Infrastructure Services
- Utility Libraries

### Internal Integration Tests (aka. Component Tests)
[Internal Integration Tests](/test/integration/internal) (in progress) are used to verify the full application behavior including the units that are not good candidates for unit testing because they only contain orchestration logic, such as API controllers and application use cases.

### External Integration Tests
[External Integration Tests](/test/integration/external) verify the behavior of integrations with external services or infrastructure.
