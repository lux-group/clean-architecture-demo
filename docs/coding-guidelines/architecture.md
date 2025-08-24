# Clean Architecture
## Introduction
The application adopts a [Clean Architecture](https://www.amazon.com.au/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164/ref=pd_bxgy_d_sccl_1/358-2171586-5171204) style and basic domain-driven design, and adopts numerous well-known design patterns.

Related ADRs:
- [ADR-001](/docs/adr/001-clean-architecture-adoption.md) - Adopt Clean Architecture Pattern

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
- **Event Bus Interfaces**: Dedicated `EventPublisher` interface without subscription management.
- **Domain Events**: Specific event types (`AuthenticationEvent`, `SessionEvent`) rather than one large interface

### Dependency Inversion Principle (DIP)
- **Core Architecture**: Domain layer defines interfaces that infrastructure implements
- **Dependency Injection**: Using [awilix](https://github.com/jeffijoe/awilix) container for inverting dependencies
- **Adapter Interfaces**: Domain depends on abstractions (`TokenIssuer`, `EventPublisher`, `UserRepository`) not concrete implementations

## Design Patterns Applied

### Domain Model Pattern
There are a few well-known patterns for implementing business/domain logic, such as Transaction Script, Active Record, and Domain Model. This application uses a simple [Domain Model](https://aussiecommerce.atlassian.net/wiki/x/FwDx0w) which is great for managing complex domain logic and making the code expressive and easier to reason about.

### Domain Events / Event-Driven Architecture
The application raises events for completed or attempted actions such as sign-in or issued tokens. An audit log consumer subscribes to these events to log them for auditing. Additional consumers could be added for other purposes such as publishing events to an event bus for consumption by other services.

### Repository Pattern
Domain repositories abstract data persistence from the domain (core) and take care of all data-related concerns such as generating SQL statements (with the help of ORMs) and mapping data between the domain model and the database model. 

### Decorator Pattern
The [Redis Repositories](/src/infrastructure/repositories/redis) are implemented as decorators for [Prisma Repositories](/src/infrastructure/repositories/prisma). This means they both implement the same [Repository Interface](/src/domain/repositories/), and the Redis repositories sit on top of the Prisma repositories and proxy requests through to Prisma while adding caching.

### Dependency Injection Pattern
To avoid spaghetti code, the application does not use any global singleton variables like `logger`, `config`, or `prismaClient`. Instead, all dependencies are "injected" into the consumers that need them, usually via class constructors.

To automate dependency injection, the application uses [awilix](https://github.com/jeffijoe/awilix). The library is non-intrusive and easy to replace or remove. Unlike decorator-based DI containers, awilix works fine with functions and even primitive values. But be aware that it relies on consistent dependency names.

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
