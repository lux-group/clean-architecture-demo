# ADR-002: Use Awilix for Dependency Injection

## Status
Accepted

## Context
The application needs a dependency injection container to manage dependencies and achieve inversion of control. Key requirements:
- Support for constructor injection
- Work with both classes and functions
- Allow injecting TypeScript interfaces instead of concrete types.
- Support for different lifetimes (singleton, transient)
- Non-intrusive - the choice or use of a DI container should have minimal impact on code and services should not get coupled to the container

Alternatives considered:
- **Manual DI**: Simple but becomes unwieldy at scale
- **Inversify**: Decorator-based, more complex setup
- **TSyringe**: Microsoft-backed but requires decorators
- **Awilix**: Function and class-based, non-intrusive

## Decision
We will use Awilix as our dependency injection container.

The main reason is that unlike most other TypeScript DI containers, Awilix does not require decorators for annotating services and dependencies. Using decorators has some severe limitations and impacts:
  - Code gets cluttered with decorators and coupled to the library.
  - Does not easily allow injecting interfaces, which defeats the whole purpose of DI.
  - All code needs to be designed around the DI container technology.

So, the reasons for choosing Awilix are:

1. **Non-intrusive**: Works without decorators or special annotations, keeping all code properly decoupled from the container technology.
2. **Flexible**: Supports both classes and functions equally well.
3. **TypeScript support**: Supports interface injection unlike some decorator-based ones.
4. **Lifetime management**: Built-in support for singleton/transient lifetimes

## Implementation Pattern
```typescript
// Module registration
container.register({
  userRepository: asClass(PrismaUserRepository).singleton(),
  passwordVerifier: asClass(BCryptPasswordVerifier).singleton(),
  createUserHandler: asClass(CreateUserHandler).singleton(),
})

// Constructor injection
export class CreateUserHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordVerifier: PasswordVerifier,
  ) {}
}

// Function injection
export function createUser(
  userRepository: UserRepository,
  passwordVerifier: PasswordVerifier,
) {
  return async (command: CreateUserCommand) => {
    // Implementation
  }
}
```

## Consequences

### Positive
- **Consistency**: Naming-based resolution creates predictable patterns
- **Simplicity**: No decorators or complex configuration required
- **Testability**: Easy dependency mocking and override
- **AI-Friendly**: Simple, consistent patterns for code generation
- **Flexibility**: Supports multiple registration patterns

### Negative
- **Naming dependency**: Relies on consistent naming conventions
- **Runtime resolution**: Dependency errors discovered at runtime (not a big risk because integration tests instantiate all services)
- **Learning curve**: Team needs to understand container concepts

## Implementation Notes
- Use consistent camelCase naming for all registrations
- Keep the registration name consistent with the interface name, e.g. *logger* for `Logger`
- Prefer registering handlers and controllers as singletons for better performance
- Create module files for organized registration
