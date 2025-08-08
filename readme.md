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
### Integration Tests
#### Internal Integration Tests
Internal Integration Tests are used to verify the full application behavior including areas that are not good candidates for unit testing because they only contain orchestration logic, such as API controllers and application use cases (command and query handlers).

- Admin Modules
  - [identity-provider](/src/app/admin/identity-provider/__tests__)
  - [session](/src/app/admin/session/__tests__)
  - [signing-Key](/src/app/admin/signing-key/__tests__)
  - [user](/src/app/admin/user/__tests__)
- Authentication Modules
  - [external](/src/app/authentication/external/__tests__)
  - [local](/src/app/authentication/local/__tests__)
- Authorization Modules
  - [well-known](/src/app/authorization/well-known/__tests__)
  - [token](/src/app/authorization/token/__tests__)

#### External Integration Tests
External Integration Tests verify the behavior of integrations with external services or infrastructure in isolation.

- [Prisma Repositories](/src/infrastructure/repositories/prisma)
- [Redis Repositories](/src/infrastructure/repositories/redis)

### Unit Tests
This project demonstrates how clean architecture produces small modules that encapsulate self-contained business or utility logic, characterized by high cohesion and low coupling. This is a critical prerequisite for writing reliable and maintainable unit testing.

This project contains unit tests for:
- [API Middleware](/src/app/shared/middleware) (solitary)
- [Domain Entities](/src/domain/entities) (solitary)
- [Domain Services](/src/domain/services) (sociable)
- [Infrastructure Services](/src/infrastructure) (solitary)
- [Utility Libraries](/src/lib) (solitary)




for (const { propertyKey, identifier, args, isErrorHandler } of middlewareInfos) {
  const propertyName = String(propertyKey)
  const collection = isErrorHandler ? errorHandlers : middleware
  collection[propertyName] = collection[propertyName] ?? []
  collection[propertyName].push(container.resolve(identifier)(args)) // <-- pass args[0] or ...args
}
```
  - This aligns with the `authorize` middleware signature:
  ```startLine:11:endLine:18:src/app/shared/middleware/authorize.ts
// The first wrapper function is user for dependency injection.
export function authorize(logger: Logger) {
  // The second wrapper function is used by the decorator to inject arguments.
  return (options: AuthorizeOptions) => {
    return (req: Request, res: Response, next: NextFunction) => {
```
- • Use domain adapters in app middleware
  - `authorize.ts` directly uses `jsonwebtoken` decoding. Prefer depending on the domain `TokenValidator` via DI to keep boundaries clean and reuse validation logic.
- • Tighten Express body parsers and security
  - In `createServer`, add `express.json({ limit })` and `express.urlencoded({ extended: false, limit })`, and conditionally enable `'unsafe-inline'` CSP only in dev (you already note it’s for demo).
- • Controller discovery by name
  - Name-based discovery is neat for demos. For production, consider explicit controller registration to avoid accidental exposure and to allow tree-shaking.

### Domain model & events
- • Stronger typing for validation helper
  - `validateProps` accepts `ZodObject` and `object`. Improve typing to infer the input from the schema generic and return the parsed type to prevent mismatches at callsites.
- • Encapsulation of `Entity.props`
  - The base `Entity` exposes a protected `props` setter and mutable prop container. Consider update methods that return new prop objects (or explicit setters per intent) to reduce the chance of bypassing invariants.
- • Branded ID types
  - Replace raw `string` IDs with branded types (e.g., `type UserId = string & { __brand: "UserId" }`) to avoid mixing different ID kinds across repositories and events.
- • Event interfaces and subscription coupling
  - `EventPublisher` only exposes `publishEvent`, but `EventLoggerAdapter` depends on the concrete `EventBus` to subscribe. Consider splitting interfaces into `EventPublisher` and `EventSubscriber` (or `EventBroadcaster`) and depending on abstractions in `EventLoggerAdapter` to decouple from the concrete bus.
- • Event correlation and consistency
  - Add `correlationId` to the base `Event` and propagate it (from request headers) for unified tracing across handlers and repositories.
- • Event factory methods
  - You’re already using per-scenario factories in `AuthenticationEvent`/`AuthorizationEvent` which matches your preference [[memory:5132229]]. Ensure all event classes (e.g., `SessionEvent`, `EntityChangeEvent`) expose similarly named, specific factories for every raised scenario and keep the constructor private.

### Application services / CQRS
- • Input validation at the edge
  - Readme says API validation is minimal; add per-action zod schemas or simple DTO validators in controllers before invoking handlers. This keeps handlers focused purely on orchestration.
- • Handler response shaping
  - Some controllers return 204 with cookies only (e.g., sign-in). If used beyond demo, consider returning minimal DTOs for frontends that cannot rely solely on cookies.

### Infrastructure & config
- • Config schema type
  - You export `type Config = z.input<typeof schema>`. Prefer `z.output<typeof schema>` so downstream code sees parsed, defaulted values rather than pre-parse input types.
- • Remove env reads from schema defaults
  - `schema` uses `.default(process.env.*)`. Keep environment resolution outside the schema; pass resolved values into `schema.parse` so the schema is pure and testable. Also add `.env.example` and a loader.
- • Redis client lifecycle
  - You connect Redis without awaiting the promise. Consider awaiting during boot or marking the resolver async and failing fast if connection fails. You already set a disposer; also wire process signal handlers to call container disposers for graceful shutdown.
- • Prisma client and UoW boundaries
  - `PrismaUnitOfWork` is solid. Ensure all write paths in handlers run inside a UoW where consistency matters (most do via direct repos; consider wrapping multi-repo operations that must be atomic).

### Error handling & logging
- • Log levels and structure
  - `handleClientErrors` logs at `info`. Consider `warn` for 4xx and structured error logging with sanitized metadata. Ensure `handleServerErrors` includes the stack trace only in non-production responses (you already hide it from the response; keep it in logs).
- • OAuth error mapping
  - In `handleOAuthErrors`, map 401/403 to RFC-compliant error codes depending on the failure cause (`invalid_token`, `insufficient_scope`, etc.), rather than a single `unauthorized_client` for all 401s.

### Testing & toolchain
- • Add scripts for database lifecycle
  - Include `prisma generate`, `migrate dev`, and a seeded dev DB script in `package.json` to reduce friction switching from memory to Prisma+Redis.
- • Linting and formatting consistency
  - Add ESLint with recommended TypeScript rules and Prettier. It will catch minor issues like the decorator args bug and typing gaps early.

### Small quality nits
- • `MemoryRepository.tryGet` is very dynamic and unsound for TS; if kept, confine to test-only or add a narrow typed filter interface per entity.
- • Avoid throwing raw `Error` in `AuthorizationService` for missing signing key; prefer a typed domain error or an infra error class for clarity and testability.
- • Consider request correlation ID middleware and include correlation ID in logs and events for cross-cutting observability.

- - -

- Mapped the architecture from the README and scanned modules across `app`, `domain`, and `infrastructure`.
- Key suggestions:
  - Environment-driven repository registration; stronger DI patterns.
  - Fix decorator middleware argument passing; move auth middleware to use domain `TokenValidator`.
  - Improve config typing (`z.output`), remove env defaults from schema; add .env management.
  - Tighten Express parsers/CSP; refine error logging/levels and OAuth error mapping.
  - Strengthen domain typing (branded IDs), event correlation, and event interface separation.
  - Add request validation at controllers; scripts for Prisma lifecycle; lint/prettier.