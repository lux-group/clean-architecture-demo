# Clean Architecture

## Introduction

The application adopts a [Clean Architecture](https://www.amazon.com.au/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164/ref=pd_bxgy_d_sccl_1/358-2171586-5171204) style and basic domain-driven design, and applies numerous well-known design patterns.

Related ADRs:
- [ADR-001](/docs/adr/001-clean-architecture-adoption.md) - Adopt Clean Architecture Pattern

## SOLID Principles Applied

### Single Responsibility Principle (SRP)

- **Domain Entities**: Each entity (`User`, `Session`, `IdentityProvider`, `SigningKey`) has a single responsibility - managing its own business rules and state
- **Domain Services**: `AuthenticationService`, `AuthorizationService`, and `SessionService` each handle specific domain concerns
- **Use Cases**: Application services like `CreateUserHandler` have a single responsibility - orchestrating one specific business flow
- **API Endpoints**: Each endpoint file handles a single operation (create, read, update, delete)
- **Adapters**: Each adapter interface (`TokenIssuer`, `PasswordVerifier`, `EventPublisher`) has one clear purpose

### Open/Closed Principle (OCP)

- **Repository Pattern**: New repository implementations can be added without modifying existing interfaces
- **Adapter Pattern**: New infrastructure implementations (like different password hashers or token issuers) can be added without changing domain code
- **Decorator Pattern**: Redis repositories extend base functionality without modifying Prisma repositories

### Liskov Substitution Principle (LSP)

- **Repository Implementations**: `RedisSessionRepository` can substitute `SessionRepository` interface seamlessly
- **Infrastructure Adapters**: `BCryptPasswordVerifier` can be substituted with any other `PasswordVerifier` implementation

### Interface Segregation Principle (ISP)

- **Consumer-focused REST APIs**: The REST APIs are segregated into consumer-focused areas that can be versioned and evolve independently
- **Specific Repository Interfaces**: `UserRepository` extends base `Repository` with only user-specific methods
- **Focused Adapter Interfaces**: Each adapter interface (`TokenIssuer`, `TokenValidator`, `PasswordVerifier`) is minimal and focused
- **Event Bus Interfaces**: Dedicated `EventPublisher` interface without subscription management
- **Domain Events**: Specific event types (`AuthenticationEvent`, `SessionEvent`) rather than one large interface

### Dependency Inversion Principle (DIP)

- **Core Architecture**: Domain layer defines interfaces that infrastructure implements
- **Dependency Injection**: Using [awilix](https://github.com/jeffijoe/awilix) container for inverting dependencies
- **Adapter Interfaces**: Domain depends on abstractions (`TokenIssuer`, `EventPublisher`, `UserRepository`) not concrete implementations

## Design Patterns Applied

### Domain Model Pattern

There are a few well-known patterns for implementing business/domain logic, such as Transaction Script, Active Record, and Domain Model. This application uses a simple [Domain Model](https://aussiecommerce.atlassian.net/wiki/x/FwDx0w) which is great for managing complex domain logic and making the code expressive and easier to reason about.

Domain entities are implemented as immutable TypeScript types with companion objects containing static methods for creation and operations. This functional approach provides:
- Immutability by default via `Readonly<>` types
- Clear separation between data (type) and behavior (object methods)
- Easy testing with pure functions
- No class inheritance complexity

### Domain Events / Event-Driven Architecture

The application raises events for completed or attempted actions such as sign-in or issued tokens. An audit log consumer subscribes to these events to log them for auditing. Additional consumers could be added for other purposes such as publishing events to an event bus for consumption by other services.

### Dependency Injection Pattern

To avoid spaghetti code, the application does not use any global singleton variables like `logger`, `config`, or `prismaClient`. Instead, all dependencies are "injected" into the consumers that need them, via factory functions or class constructors.

To automate dependency injection, the application uses [awilix](https://github.com/jeffijoe/awilix). The library is non-intrusive and easy to replace or remove. It works well with both classes and factory functions. Be aware that it relies on consistent dependency names.

### Adapter Pattern

All infrastructure is abstracted using generic interfaces (ports) defined by the application and their concrete implementations (adapters). This is a key design pattern to enable inversion of control and adopt good architecture styles, such as Clean Architecture, Onion Architecture, or Hexagon Architecture.

### Repository Pattern

Domain repositories are a specialised form of the Adapter Pattern. The domain specifies its data needs in form of [Repository Interfaces](/src/domain/repositories/) that are implemented by the infrastructure layer. This ensures that the domain logic can stay focused on business logic and does not have to deal with all the data-related concerns, such as generating SQL statements or mapping data between schemas.

Multiple implementations can be used, such as [Prisma Repositories](/src/infrastructure/repositories/prisma) for persistence, [Redis Repositories](/src/infrastructure/repositories/redis) for caching, and [Memory Repositories](/src/infrastructure/repositories/memory) for testing.

### Decorator Pattern

- **Caching Repositories**: The [Redis Repositories](/src/infrastructure/repositories/redis) are implemented as decorators for the persistence repositories (Prisma). This makes caching completely transparent to the application.

### Strategy Pattern

- **Authentication Providers**: Different authentication providers (Entra ID, Google, Facebook, Apple) abstracted through a common interface.
- **Repository Implementations**: Different data access strategies (memory, Prisma, Redis)

### Factory Pattern

- **Entity Creation**: `User.createNew()` factory method for creating new entities
- **Handler Factories**: API handler factories that receive dependencies and return Express handlers
- **Client Factory**: `AuthClientFactory` for creating OAuth clients

### Builder Pattern

- **Data Mapper**: `MapperBuilder` for building type-safe data mapping functions with a fluent interface.

### Observer Pattern

- **Domain Events**: `EventPublisher` allows multiple subscribers to domain events
- **Event Bus**: Decoupled event handling for audit logging and other cross-cutting concerns

### Command Pattern & CQRS

- **[Command Query Responsibility Segregation (CQRS)](https://aussiecommerce.atlassian.net/wiki/x/BwC01)**: Each use case implemented as a dedicated command handler (changes state) or query handler (does not change state) with clear segregation between them.
- **Input/Output DTOs**: Clear command/query interfaces with typed inputs/outputs
