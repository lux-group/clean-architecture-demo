# Development Guide: Dependency Injection (Awilix)

This project uses Awilix for dependency injection to compose the application at the edges while keeping domain and application code decoupled from the container. See the ADR for rationale and tradeoffs: [ADR-002](../adr/002-dependency-injection-with-awilix.md).

## Container setup

The container is created with classic injection and strict mode. Composition happens via feature and infrastructure modules.

```ts
// src/index.ts
const container = createContainer({
  injectionMode: InjectionMode.CLASSIC,
  strict: true,
})

await registerConfig(container, environment)
await registerApp(container)
await registerDomainServices(container)
await registerInfrastructureServices(container)

await registerPrismaRepositories(container)
await registerRedisDecoratorRepositories(container)
```

On shutdown the container is disposed to run resource disposers and close connections.

## Registration patterns

Use Awilix resolvers:

- `asClass(MyService).singleton()` for classes
- `asFunction(factory).singleton()` for factories/providers
- `asValue(value)` for constants/config
- `aliasTo("otherRegistration")` to expose the same instance under another key

Examples:

```ts
// src/infrastructure/module.ts (excerpt)
container.register({
  eventPublisher: aliasTo("eventBus"),
  eventBus: asClass(EventBus).singleton(),
  passwordVerifier: asClass(BCryptPasswordVerifier).singleton(),
  tokenIssuer: asClass(JsonWebTokenIssuer).singleton(),
  tokenValidator: asClass(JsonWebTokenValidator).singleton(),
  logger: asClass(ConsoleLogger).singleton(),
})
```

```ts
// src/infrastructure/config/module.ts (excerpt)
container.register({
  config: asValue(config),
  baseUrl: asValue(config.apiHost),
  encryptionKeys: asValue(config.encryptionKeys),
  redisUrl: asValue(config.redisUrl),
  sessionConfig: asValue(config.sessions),
  tokenIssuerConfig: asValue(config.tokenIssuer),
})
```

### Lifetimes and disposers

- Prefer `singleton()` for stateless services, controllers, handlers, and repositories.
- Use `transient()` for per-operation constructs (e.g., `unitOfWork`).
- For external resources, register a provider and a `disposer` to clean up:

```ts
// src/infrastructure/repositories/prisma/module.ts (excerpt)
container.register({
  prismaClient: asFunction(() => prismaClient).singleton().disposer(c => c.$disconnect()),
  unitOfWork: asClass(PrismaUnitOfWork).transient(),
})

// src/infrastructure/repositories/redis/module.ts (excerpt)
container.register({
  redisClient: asFunction(() => client).singleton().disposer(c => c.quit()),
})
```

## Naming conventions (resolution by name)

Resolution relies on consistent, lowerCamelCase keys that mirror interface names and roles:

- Controllers end with `Controller` and live in `src/app/**/api/`
- Handlers end with `Handler` and live in `src/app/**/{commands,queries}/`
- Repositories use `<entity>Repository` (domain interface); concrete implementations are registered under the same key
- Common adapters/services follow their interface names (e.g., `eventPublisher`, `tokenIssuer`, `passwordVerifier`)

These conventions enable discoverability and wiring without decorators in the application code.

## Repository decoration (Redis caching pattern)

We use a decoration pattern to add read-through caching without changing callers. The decorator replaces the DI key while preserving the decorated instance under `redisDecorated_<name>`:

```ts
// src/infrastructure/repositories/redis/module.ts (excerpt)
function decorate(container: AwilixContainer, name: string, resolver: Resolver<any>) {
  container.register({
    ["redisDecorated_" + name]: container.registrations[name],
    [name]: resolver,
  })
}

decorate(container, "identityProviderRepository", asClass(RedisIdentityProviderRepository).singleton())
```

Consumers continue to inject `identityProviderRepository` and transparently get the cached implementation.

## Composition modules

- `src/app/module.ts`: registers feature modules (admin/auth/authorization/integration/shared)
- `src/domain/services/module.ts`: domain services (`authenticationService`, `authorizationService`, `sessionService`)
- `src/infrastructure/module.ts`: cross-cutting adapters (event bus, crypto, JWT, logging)
- `src/infrastructure/repositories/*/module.ts`: persistence implementations per technology
- `src/infrastructure/config/module.ts`: environment-specific configuration values

## Overriding dependencies (tests and experiments)

You can override any registration by re-registering the key:

```ts
// Replace token validation with a stub in a test
container.register({ tokenValidator: asValue({ validate: async () => ({ header: {}, payload: {} }) }) })
```

For scoped overrides, create a new container or a scope and register within that scope before resolving.

## Best practices

- Keep domain/application code free of container-specific imports or annotations
- Inject interfaces by name; avoid resolving inside classes
- Use `strict: true` to fail fast on missing registrations
- Prefer singletons; be deliberate with transients
- Always register disposers for long-lived connections
- Keep registration names stable; refactors that change names can break wiring

