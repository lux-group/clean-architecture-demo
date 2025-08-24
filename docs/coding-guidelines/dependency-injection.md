# Dependency Injection
## Introduction
This project uses Awilix for dependency injection to compose the application at the edges while keeping domain and application code decoupled from the container.

Related ADRs:
- [ADR-002](/docs/adr/002-dependency-injection-with-awilix.md) - Use Awilix for Dependency Injection

## Container setup
The container is created with classic injection and strict mode. Composition happens via feature and infrastructure modules.

```ts
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

```ts
await container.dispose()
```

## Registration patterns

Use Awilix resolvers:

- `asClass(MyService).singleton()` for classes
- `asFunction(factory).singleton()` for factories and providers
- `asValue(value)` for constants and config
- `aliasTo("otherRegistration")` to expose the same instance under another key

Examples:

```ts
// src/infrastructure/module.ts (excerpt)
container.register({
  eventPublisher: aliasTo("eventBus"),
  eventBus: asClass(EventBus).singleton(),
  passwordVerifier: asClass(BCryptPasswordVerifier).singleton(),
  logger: asClass(ConsoleLogger).singleton(),
})
```

```ts
// src/infrastructure/config/module.ts (excerpt)
container.register({
  baseUrl: asValue(config.apiHost),
  encryptionKeys: asValue(config.encryptionKeys),
  sessionConfig: asValue(config.sessions),
})
```

## Disposers
Use `disposer` to clean up resources or close database connections when the application is shut down.

```ts
// src/infrastructure/repositories/prisma/module.ts (excerpt)
container.register({
  prismaClient: asFunction(() => prismaClient).singleton().disposer(c => c.$disconnect())
})

// src/infrastructure/repositories/redis/module.ts (excerpt)
container.register({
  redisClient: asFunction(() => client).singleton().disposer(c => c.quit()),
})
```

## Naming conventions

Resolution relies on consistent, lowerCamelCase keys that mirror interface names and roles:

- Keys should be the name of the service in lowerCamelCase. For example, class `PasswordVerifier` is registered as `passwordVerifier`.
- Keys must represent the interface not implementation. For example, `BCryptPasswordVerifier` is registered as `passwordVerifier`.

## Lifetimes
- Prefer `singleton()` for stateless services, controllers, handlers, and repositories.
- Use `transient()` for per-operation constructs (e.g., `unitOfWork`).
