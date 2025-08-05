# Introduction
This project started as a POC for [Auth Service V2](https://aussiecommerce.atlassian.net/wiki/x/wQES3g). However, it has evolved into a demo project for [Clean Architecture](https://www.amazon.com.au/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164/ref=pd_bxgy_d_sccl_1/358-2171586-5171204), demonstrating numerous design principles and patterns in action.

# Auth Service V2
### Demonstrated features
- Sign-up, sign-in, and sign-out with Entra ID
  - Front-channel logout
  - Check session state using refresh tokens
  - Extensions called by Entra ID to customize the sign-up flow
- Sign-in with Google, Apple, Facebook
- Local authentication with email and password
- User impersonation (spoofing)
- Session management with secure, encrypted, HTTP-only cookies.
- OAuth2 Token endpoint
  - Custom grant to get access token with session cookie
  - Client Credentials grant using user-id and password
  - Token Exchange grant
- OIDC metadata & JWKS endpoints
- Profile edit or anonymisation in Entra ID via MS Graph API.
- Authorization with `audience` and `scope` (structure only)
- Audit logging using domain events

### Notes
- The API does not contain much data validation because we already have a framework for that in our standard template. But the domain entities fully validate all inputs using Zod.
- Four well-known libraries are used to read, write, and validate JWTs and interact with OIDC providers. There is some overlap between them because the OIDC client contains its own JWT validation. The *TokenValidator.ts* class is only used for the token exchange grant.

# Code Structure
| Folder | Responsibility |
| --- | --- |
| 📁 [app](/src/app) | Application use case implementations and triggers (API, scheduled tasks, event subscribers) |
| &nbsp;&nbsp; 📁 \[feature] | The app folder is segregated into feature modules.<br/>In most cases, there are two levels. |
| &nbsp;&nbsp; &nbsp;&nbsp; 📁 api | API controllers, routes, presenters, and middleware |
| &nbsp;&nbsp; &nbsp;&nbsp; 📁 events | Event handlers |
| &nbsp;&nbsp; &nbsp;&nbsp; 📁 jobs | Scheduled jobs |
| &nbsp;&nbsp; &nbsp;&nbsp; 📁 commands | Application use case implementations that change state.<br/>They orchestrate business logic in the domain but don't contain business logic. |
| &nbsp;&nbsp; &nbsp;&nbsp; 📁 queries | Application use case implementations that do not change state. |
| 📁 [domain](/src/domain) | The domain (or *core*) contains all the application's business logic.<br/>This project uses [Domain Models](https://aussiecommerce.atlassian.net/wiki/x/FwDx0w) but other [styles](https://aussiecommerce.atlassian.net/wiki/x/EYDp0w) like Transaction Script are also possible. |
| &nbsp;&nbsp; 📁 [adapters](/src/domain/adapters) | Interfaces for infrastructure services used by domain services.<br/>Their implementations can be found in [/infrastructure/adapters](/src/infrastructure/adapters). |
| &nbsp;&nbsp; 📁 [entities](/src/domain/entities) | Domain entities that contain the applications core business structures and rules. |
| &nbsp;&nbsp; 📁 [errors](/src/domain/errors) | Domain errors and common error messages |
| &nbsp;&nbsp; 📁 [events](/src/domain/events) | Domain event messages |
| &nbsp;&nbsp; 📁 [repositories](/src/domain/repositories) | Interfaces for data repositories.<br/>Their implementations can be found in [/infrastructure/repositories](/src/infrastructure/repositories). |
| &nbsp;&nbsp; 📁 [services](/src/domain/services) | Domain services shared by multiple use cases where logic does not fit into an entity. |
| 📁 [infrastructure](/src/infrastructure) | Contains concrete implementations of domain interfaces and technical concerns |
| &nbsp;&nbsp; 📁 [adapters](/src/infrastructure/adapters) | Implements domain adapter interfaces.<br/>(Password verification, Token validation/issuing, Event publishing, etc.) |
| &nbsp;&nbsp; 📁 [auth](/src/infrastructure/auth) | OAuth2 Clients for OIDC (Entra ID, Google), Facebook, Apple |
| &nbsp;&nbsp; 📁 [config](/src/infrastructure/config) | Application configuration |
| &nbsp;&nbsp; 📁 [crypto](/src/infrastructure/crypto) | Cryptography utility services |
| &nbsp;&nbsp; 📁 [logging](/src/infrastructure/logging) | Logger - currently just a simple console logger implementation |
| &nbsp;&nbsp; 📁 [repositories](/src/infrastructure/repositories) | Repository implementations with different storage strategies |
| &nbsp;&nbsp; &nbsp;&nbsp; 📁 [memory](/src/infrastructure/repositories/memory) | In-memory repositories for manual local testing. |
| &nbsp;&nbsp; &nbsp;&nbsp; 📁 [prisma](/src/infrastructure/repositories/prisma) | Primary data storage using Prisma ORM |
| &nbsp;&nbsp; &nbsp;&nbsp; 📁 [redis](/src/infrastructure/repositories/redis) | Cache layer decorating Prisma repositories |
| 📁 [lib](/src/lib) | Common utility libraries (no domain logic) |

# Clean Architecture
## Introduction
The key difference between the traditional layered architecture usually adopted at Luxury Escapes and [Clean Architecture](https://www.amazon.com.au/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164/ref=pd_bxgy_d_sccl_1/358-2171586-5171204) (aka. Onion Architecture, Hexagon Architecture) lies in the direction of dependencies.

In traditional layered architectures, dependencies flow downward — from core domain logic to external components like databases, caches, or third-party APIs. As a result, the domain layer must orchestrate every dependency directly, in addition to handling business rules. This tight coupling can lead to bloated, unfocused code that becomes increasingly difficult to understand, test, and maintain as complexity grows.

**Clean Architecture reverses this flow: dependencies point inward toward the core domain, ensuring it remains fully independent of external frameworks, infrastructure, and services.** Instead of the domain logic driving its dependencies, the dependencies are shaped to serve the domain. This shift leads to components with higher cohesion, reduced coupling, and well-defined boundaries — making the codebase more maintainable and testable.

To achieve this structure, we rely on proven design principles such as the Dependency Inversion Principle, and apply patterns like the Adapter Pattern to decouple interactions across architectural boundaries.

![Clean Architecture Diagram](https://blog.cleancoder.com/uncle-bob/images/2012-08-13-the-clean-architecture/CleanArchitecture.jpg)

## SOLID Principles Applied

### Single Responsibility Principle (SRP)
- **Domain Entities**: Each entity (`User`, `Session`, `IdentityProvider`, `SigningKey`) has a single responsibility - managing its own business rules and state
- **Domain Services**: `AuthenticationService`, `AuthorizationService`, and `SessionService` each handle specific domain concerns
- **Use Cases**: Application services like `SignInWithPasswordHandler` have a single responsibility - orchestrating one specific business flow
- **Adapters**: Each adapter interface (`TokenIssuer`, `PasswordVerifier`, `EventPublisher`) has one clear purpose

### Open/Closed Principle (OCP)
- **Repository Pattern**: New repository implementations can be added without modifying existing interfaces
- **Adapter Pattern**: New infrastructure implementations (like different password hashers or token issuers) can be added without changing domain code
- **Decorator Pattern**: Redis repositories extend base functionality without modifying Prisma repositories

### Liskov Substitution Principle (LSP)
- **Repository Implementations**: `RedisSessionRepository` can substitute `SessionRepository` interface seamlessly
- **Infrastructure Adapters**: `BCryptPasswordVerifier` can be substituted with any other `PasswordVerifier` implementation
- **Entity Inheritance**: Base `Entity` class can be extended by domain entities while maintaining contracts

### Interface Segregation Principle (ISP)
- **Consumer-focused REST APIs**: The REST APIs are segregated into consumer-focused areas that can be versioned and evolve independently. 
- **Specific Repository Interfaces**: `UserRepository` extends base `Repository` with only user-specific methods
- **Focused Adapter Interfaces**: Each adapter interface (`TokenIssuer`, `TokenValidator`, `PasswordVerifier`) is minimal and focused
- **Event Bus Interfaces**: Dedicated `EventPublisher` interface that does not contain subscription management.
- **Domain Events**: Specific event types (`AuthenticationEvent`, `SessionEvent`) rather than one large interface

### Dependency Inversion Principle (DIP)
- **Core Architecture**: Domain layer defines interfaces that infrastructure implements
- **Dependency Injection**: Using [awilix](https://github.com/jeffijoe/awilix) container for inverting dependencies
- **Adapter Interfaces**: Domain depends on abstractions (`TokenIssuer`, `EventPublisher`, `UserRepository`) not concrete implementations

## Design Patterns Applied

### Domain Model Pattern
There are a few well-known patterns for implementing business/domain logic, such as Transaction Script, Active Record, and Domain Model. This application uses a simple [Domain Model](https://aussiecommerce.atlassian.net/wiki/x/FwDx0w) which is great for managing complex domain logic and making the code expressive and easier.

### Domain Events / Event-Driven Architecture
The application raises events for completed or attempted actions such as sing-in or issued tokens. An audit log consumer subscribes to these events to log them for auditing. Additional consumers could be added for other purposes such as publishing events to an event bus for consumption by others services.

### Repository Pattern
Domain repositories abstract data persistence from the domain (core) and take care of all data-related concerns such is generating SQL statements (with the help of ORMs) and mapping data between the domain model and the database model. 

```typescript
// Domain defines the interface independent of the data store
export interface UserRepository extends Repository<User> {
  tryGetByBrandAndEmail(brand: string, email: string): Promise<User | undefined>
}

// Infrastructure implements it using a specific technology
export class PrismaUserRepository implements UserRepository
```

### Decorator Pattern
The [Redis Repositories](/src/infrastructure//repositories/redis) are implemented as decorators for [Prisma Repositories](/src/infrastructure//repositories/prisma). This means, they both implement the same [Repository Interface](/src/domain//repositories/) but the Redis repositories sit on top of the Prisma Repositories and proxy requests through to Prisma but add caching.

```typescript
// Redis repositories decorate Prisma repositories with caching
export class RedisUserRepository implements UserRepository {
  constructor(private readonly decoratedUserRepository: UserRepository) {}
}
```

### Dependency Injection Pattern
To avoid spaghetti code, the application does not use any global singleton variables like `logger`, `config`, or `prismaClient`. Instead all dependencies are "injected" into the consumers that need them, usually via class constructors.

```TypeScript
import { Logger } from "~/infrastructure/logging"

// Constructor injection
class MyService {
  constructor(private readonly logger: Logger) {}
}

// Function injection
function myService(logger: Logger) {
}
```

To automate dependency injection, the application uses [awilix](https://github.com/jeffijoe/awilix). The library is non-intrusive and easy to replace or remove. Unlike decorator-based DI containers, awilix works fine with functions and even primitive values. But be aware that it relies on consistent dependency names.

```TypeScript
import { asClass, asFunction } from "awilix"
import { ConsoleLogger } from "~/infrastructure/logging/ConsoleLogger"

container.register({
  logger: asClass(ConsoleLogger).singleton(),
  myService: asClass(MyService).singleton(), // Constructor injection
  myService: asFunction(myService).singleton(), // Function injection
})

const myService = container.resolve<MyService>("myService")
```

### Adapter Pattern
- **Infrastructure Adapters**: `BCryptPasswordVerifier`, `JsonWebTokenIssuer` adapt external libraries to domain interfaces
- **Domain Adapters**: Abstract infrastructure concerns behind domain-focused interfaces

### Strategy Pattern
- **Authentication Providers**: Different authentication providers (Entra ID, Google, Facebook, Apple) abstracted through a common interface.
- **Repository Implementations**: Different data access strategies (memory, Prisma, Redis)

### Factory Pattern
- **Entity Creation**: `User.createNew()` factory method for creating new entities
- **Client Factory**: `AuthClientFactory` for creating OAuth clients

### Command Pattern & CQRS
- **[Command Query Responsibility Segregation (CQRS)](https://aussiecommerce.atlassian.net/wiki/x/BwC01)**: Each use case implemented as a dedicated command handler (changes state) or query handler (does not change state) with clear segregation between them.
- **Input/Output DTOs**: Clear command/query interfaces with typed inputs/outputs

### Observer Pattern
- **Domain Events**: `EventPublisher` allows multiple subscribers to domain events
- **Event Bus**: Decoupled event handling for audit logging and other cross-cutting concerns

# Test Strategy
### Unit Tests
This project demonstrates how clean architecture produces small modules that encapsulate self-contained business or utility logic, characterized by high cohesion and low coupling. This is a critical prerequisite for writing reliable and maintainable unit testing.

This project contains unit tests for:
- API Middleware (solitary)
- Domain Entities (solitary)
- Domain Services (sociable)
- Infrastructure Services (solitary)
- Utility Libraries (solitary)

### Integration Tests
#### Internal
Internal Integration Tests (aka. Component Tests) are used to verify the full application behavior including areas that are not good candidates for unit testing because they only contain orchestration logic, such as API controllers and application use cases. These tests are in the [app](/src/app) feature folders and have the extension *.spec.ts*. The tests are structured around application use cases rather than code artifacts.

#### External
External Integration Tests verify the behavior of integrations with external services or infrastructure such as Postgres and Redis. They are located next to the integration they test, for example [infrastructure/repositories/postgres](/src/infrastructure/repositories/postgres).
