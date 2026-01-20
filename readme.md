# Introduction
This project started as a POC for [Auth Service V2](https://aussiecommerce.atlassian.net/wiki/x/wQES3g). However, it has evolved into a demo project for [Clean Architecture](https://www.amazon.com.au/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164/ref=pd_bxgy_d_sccl_1/358-2171586-5171204), demonstrating numerous design principles and patterns in action.

> [!IMPORTANT]  
> The repository is not intended to be a template. Its purpose is to explain and demonstrate software architecture principles, patterns, and best practices to engineers who are interested in learning about the topic and improve the quality of their own code.

# Auth Service V2
### Demonstrated features
- Sign-up, sign-in, and sign-out with Entra ID
  - Front-channel sign-out
  - Check session state using refresh tokens
  - Extensions called by Entra ID to customise the sign-up flow
- Sign-in with Google, Apple, Facebook
- Local authentication with email and password
- User impersonation (spoofing)
- Session management with secure, encrypted, HTTP-only cookies.
- OAuth2 Token endpoint
  - Custom grant to get an access token with a session cookie
  - Client Credentials grant using user ID and password
  - Token Exchange grant
- OIDC metadata & JWKS endpoints
- Profile editing or anonymisation in Entra ID via MS Graph API.
- Authorization with `audience` and `scope` (structure only)
- Audit logging using domain events

### Notes
- The API does not contain much data validation because we already have a framework for that in our standard template. But the domain entities fully validate all inputs using Zod.
- Four well-known libraries are used to read, write, and validate JWTs and interact with OIDC providers. There is some overlap between them because the OIDC client contains its own JWT validation. The *TokenValidator.ts* class is only used for the token exchange grant.
<br/><br/>
# Clean Architecture / Onion Architecture
## Introduction
The key difference between the traditional layered architecture usually adopted at Luxury Escapes and [Clean Architecture](https://www.amazon.com.au/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164/ref=pd_bxgy_d_sccl_1/358-2171586-5171204) or [Onion Architecture](https://marcoatschaefer.medium.com/onion-architecture-explained-building-maintainable-software-54996ff8e464) lies in the direction of dependencies.

In traditional layered architectures, dependencies flow downward — from core domain logic to external components like databases, caches, or third-party APIs. As a result, the domain layer must orchestrate every dependency directly, in addition to handling business rules. This tight coupling can lead to bloated, unfocused code that becomes increasingly difficult to understand, test, and maintain as complexity grows.

**Clean and Onion Architecture reversesthis flow: dependencies point inward toward the core domain, ensuring it remains fully independent of external frameworks, infrastructure, and services.** Instead of the domain logic driving its dependencies, the dependencies are shaped to serve the domain. This shift leads to components with higher cohesion, reduced coupling, and well-defined boundaries — making the codebase more maintainable and testable.

To achieve this structure, we rely on proven design principles such as the Dependency Inversion Principle, and apply patterns like the Adapter Pattern to decouple interactions across architectural boundaries.

![Clean Architecture Diagram](https://blog.cleancoder.com/uncle-bob/images/2012-08-13-the-clean-architecture/CleanArchitecture.jpg)
![Onion Architecture Diagram](https://miro.medium.com/v2/1*0Pg6_UsaKiiEqUV3kf2HXg.png)


## SOLID Principles Applied

### Single Responsibility Principle (SRP)
- **Domain Entities**: Each entity (`User`, `Session`, `IdentityProvider`, `SigningKey`) has a single responsibility - managing its own business rules and state
- **Domain Services**: `AuthenticationService` and `AuthorizationService` each handle specific domain concerns
- **Use Cases**: Application services like `CreateUserHandler` have a single responsibility - orchestrating one specific business flow
- **API Endpoints**: Each endpoint file handles a single operation with its schema and handler
- **Adapters**: Each adapter interface (`TokenIssuer`, `PasswordVerifier`, `EventPublisher`) has one clear purpose

### Open/Closed Principle (OCP)
- **Repository Pattern**: New repository implementations can be added without modifying existing interfaces
- **Adapter Pattern**: New infrastructure implementations (like different password hashers or token issuers) can be added without changing domain code
- **Decorator Pattern**: Redis repositories extend base functionality without modifying Prisma repositories

### Liskov Substitution Principle (LSP)
- **Repository Implementations**: `RedisSessionRepository` can substitute `SessionRepository` interface seamlessly
- **Infrastructure Adapters**: `BCryptPasswordVerifier` can be substituted with any other `PasswordVerifier` implementation

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

Domain entities are implemented as immutable TypeScript types with companion objects containing static methods. This functional approach provides immutability by default, clear separation between data and behavior, and easy testing with pure functions.

### Domain Events / Event-Driven Architecture
The application raises events for completed or attempted actions such as sign-in or issued tokens. An audit log consumer subscribes to these events to log them for auditing. Additional consumers could be added for other purposes such as publishing events to an event bus for consumption by other services.

### Dependency Injection Pattern
To avoid spaghetti code, the application does not use any global singleton variables like `logger`, `config`, or `prismaClient`. Instead, all dependencies are "injected" into the consumers that need them, via factory functions or class constructors.

To automate dependency injection, the application uses [awilix](https://github.com/jeffijoe/awilix). The library is non-intrusive and easy to replace or remove. It works well with both classes and factory functions. Be aware that it relies on consistent dependency names.

### Adapter Pattern
All infrastructure is abstracted using generic interfaces (ports) defined by the application and their concrete implementations (adapters). This is a key design pattern to enable inversion of control and adopt good architecture styles, such as Clean Architecture, Onion Architecture, or Hexagon Architecture.

### Repository Pattern
Domain repositories are a specialised form the the Adapter Pattern. The domain specifies its data needs in form of [Repository Interfaces](/src/domain/repositories/) that are implemented by the infrastructure layer. This ensures that the domain logic can stay focused on business logic and does not have to deal with all the data-related concerns, such as generating SQL statements or map data between schemas.

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

## Services
The term “service” is often ambiguous and heavily overused in software development. In this project, we explicitly distinguish between three distinct types of services:

- **Application Service**: Coordinates a use case by orchestrating domain and infrastructure services.
- **Domain Service**: Encapsulates business logic that is completely independent of infrastructure concerns.
- **Infrastructure Service**: Integrates the application with external systems such as databases, caches, third‑party APIs, observability platforms, security providers, and more. They always adopt the Adapter pattern and the Inversion of Control principle.

# AI-Friendly Code Architecture

This codebase is intentionally structured to optimize compatibility with AI coding assistants, enabling them to understand, generate, and maintain code more efficiently and reliably.

## Key AI Optimizations

### 📚 **Comprehensive Documentation**
Extensive [documentation](/docs/readme.md) with pattern and examples helps AI understand context and intent.

### 🎯 **Familiar Design Patterns**
The architecture leverages widely recognized design patterns that AI models are trained on:
- **Clean Architecture**: Well-established pattern with clear layer separation
- **Repository Pattern**: Standard data access abstraction
- **Dependency Injection**: Mainstream IoC pattern using Awilix
- **Domain-Driven Design**: Rich domain models with business logic encapsulation

### 🔄 **Consistent Structure & Conventions**
Repetitive patterns allow AI to generalize solutions across the codebase:
- **File Naming**: Matches operation name (e.g., `createUser.ts`, `getUserById.ts`)
- **Feature Organisation**: One file per endpoint with co-located tests
- **DI Registration**: Predictable camelCase keys
- **Import Paths**: Consistent aliases (`~/domain`, `~/application`, `@test/`)

### 🔍 **Clear Abstractions & Boundaries**
Well-defined interfaces minimize cognitive load and token usage:
- **Layer Isolation**: Domain completely independent of infrastructure
- **Interface Segregation**: Focused, single-purpose interfaces
- **Error Boundaries**: Structured error handling with context
- **Type Safety**: Strong TypeScript typing with Zod validation

### 📝 **Meaningful Naming Conventions**
Self-explanatory identifiers reduce ambiguity:
- **No Abbreviations**: Full descriptive names (`UserRepository` not `UserRepo`)
- **Business Language**: Domain terminology in code matches business requirements
- **Consistent Prefixes**: `create`, `update`, `delete` for commands; `get`, `search` for queries
- **Clear Intent**: Method names describe what they do, not how

### 🎨 **Descriptive Domain Models**
Domain-driven design ensures semantic richness:
- **Immutable Entities**: Business logic in companion objects with pure functions
- **Domain Events**: Clear representation of business state changes
- **Ubiquitous Language**: Consistent terminology throughout the codebase; external terminology translated at the boundary

### ⚡ **Focused Functions & Methods**
Purpose-driven, stateless functions where possible:
- **Single Responsibility**: Each method has one clear purpose
- **Pure Functions**: Minimal side effects, predictable outputs
- **Command/Query Separation**: Clear distinction between state changes and reads
- **Composable Logic**: Small, reusable building blocks

### 🛡️ **Strict Type System**
TypeScript with all strict options provides explicit contracts:
- **Compile-time Safety**: Catch errors before runtime
- **IntelliSense Support**: Better AI code completion and suggestions
- **Schema Validation**: Zod schemas for runtime type checking
- **Explicit Nullability**: Clear handling of optional values

## AI Development Workflow

### 🤖 **For AI Assistants**
When working with this codebase:

1. **Read Documentation First**: Check `/docs/` for context and templates
2. **Follow Established Patterns**: Mirror existing code structure and naming
3. **Use Type Information**: Leverage TypeScript definitions for accuracy
4. **Validate Against Schema**: Ensure new code follows Zod validation patterns
5. **Include Tests**: Generate corresponding integration tests as `.spec.ts` files

### 👨‍💻 **For Human Developers**
The AI-friendly design also benefits human developers:
- **Predictable Structure**: Easy to navigate and understand
- **Self-Documenting Code**: Clear intent without deep diving
- **Consistent Patterns**: Reduced cognitive load when switching contexts
- **Comprehensive Testing**: Reliable refactoring and maintenance
