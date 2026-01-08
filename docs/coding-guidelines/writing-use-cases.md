# How to: Write a Use Case (Command/Query Handler)

## Introduction

Use cases orchestrate domain behavior. They are thin: build DTOs, call domain services/repositories, and publish events. We do not unit-test handlers in isolation; API integration tests cover them.

Related ADRs:
- [ADR-006](/docs/adr/006-cqrs-pattern-for-application-services.md) - CQRS Pattern for Application Services

## Structure

- Location: `src/application/use-cases/<area>/<feature>/<Action>.ts`
- Areas: `admin` for admin operations, `public` for public-facing operations
- Naming: `Create<Name>`, `Get<Name>ById`, `Search<Names>`
- Outer factory function for DI returns actual handler function.

### Sample Handler

```ts
import { EventPublisher } from '~/application/ports';
import { CreateIdentityProviderProps, IdentityProvider } from '~/domain/entities';
import { EntityChangeEvent } from '~/domain/events';
import { IdentityProviderRepository } from '~/domain/repositories';

export type CreateIdentityProviderCommand = CreateIdentityProviderProps;

export type CreateIdentityProvider = ReturnType<typeof createIdentityProvider>;

export const createIdentityProvider = (
  identityProviderRepository: IdentityProviderRepository,
  eventPublisher: EventPublisher,
) => {
  return async (command: CreateIdentityProviderCommand) => {
    const identityProvider = IdentityProvider.createNew(command);
    await identityProviderRepository.insert(identityProvider);

    const event = EntityChangeEvent.entityCreated('Identity Provider', identityProvider);
    eventPublisher.publishEvent(event);

    return identityProvider;
  };
};
```

## DI registration

Register handlers in `src/application/use-cases/<area>/<feature>/module.ts`:

```ts
import { AwilixContainer, asFunction } from 'awilix';
import { createIdentityProvider } from './CreateIdentityProvider';
import { getIdentityProviderById } from './GetIdentityProviderById';

export default async function registerIdentityProviderHandlers(container: AwilixContainer) {
  container.register({
    createIdentityProvider: asFunction(createIdentityProvider).singleton(),
    getIdentityProviderById: asFunction(getIdentityProviderById).singleton(),
  });
}
```

## Testing

Handlers are covered by [API integration tests](./writing-api-controllers.md). The integration tests verify the entire flow from HTTP request through handler to database.

## Best practices

- **Keep handlers thin** — orchestrate, don't implement business logic
- **Delegate to domain** — call entity methods and domain services for business rules
- **Publish events** — use `EventPublisher` for audit logging and cross-cutting concerns
- **Single responsibility** — one handler per use case
- **Clear naming** — `Create`, `Update`, `Delete` for commands; `Get`, `Search` for queries
