# ADR-001: Adopt Clean Architecture Pattern

## Status
Accepted

## Context
We needed an architectural pattern that would:
- Help manage the complexity of an Auth Service which contains complex and security-critical logic that goes beyond just simple CRUD operations.
- Make the codebase maintainable and testable
- Allow easy swapping of infrastructure components
- Separate business logic from external concerns
- Be familiar to AI coding assistants for better code generation

Traditional layered architectures create tight coupling between layers, making testing difficult and business logic scattered across multiple layers.

## Decision
We will adopt Clean Architecture (also known as Onion Architecture or Hexagonal Architecture) with the following structure:

```
src/
├── app/             # Application layer (use cases, controllers)
├── domain/          # Domain layer (entities, business rules, interfaces)
├── infrastructure/  # Infrastructure layer (external services)
└── lib/             # Shared utilities
```

Key principles:
- Dependencies point inward toward the domain
- Domain layer has no external dependencies
- Infrastructure implements domain interfaces
- Application layer orchestrates domain operations

## Consequences

### Positive
- **Testability**: Domain logic can be tested in isolation
- **Flexibility**: Easy to swap infrastructure implementations
- **AI-Friendly**: Well-known pattern that AI models understand
- **Maintainability**: Clear separation of concerns
- **Independence**: Business logic not tied to frameworks

### Negative
- **Complexity**: More files and interfaces than simple layered architecture
- **Learning Curve**: Team needs to understand dependency inversion
- **Indirection**: More abstraction layers to navigate

## Implementation Notes
- Use TypeScript interfaces for defining contracts between layers
- Implement dependency injection to manage layer dependencies
- Keep domain entities pure with business logic only
- Place infrastructure concerns in dedicated adapter implementations
