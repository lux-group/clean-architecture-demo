# Development Guide: Use Case (Command/Query Handler)

Use cases orchestrate domain behavior. They are thin: build DTOs, call domain services/repositories, and publish events. We do not unit-test handlers in isolation; API integration tests cover them.

## Structure
- Location: `src/app/<feature>/{commands,queries}/XxxHandler.ts`
- Naming: `CreateUserHandler`, `GetUserByIdHandler`
- Public API: `constructor(dependencies)` and `execute(dto): Promise<Result>`

```ts
export type CreateXxxCommand = { /* input */ }

export class CreateXxxHandler {
  constructor(/* repositories, services, adapters */) {}
  async execute(command: CreateXxxCommand) { /* orchestrate */ }
}
```

Example (`CreateUserHandler`):

```ts
export class CreateUserHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordVerifier: PasswordVerifier,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    const props: CreateUserProps = { /* shape props; zod at entity */ }
    const user = User.createNew(props)
    await this.userRepository.insert(user)
    this.eventPublisher.publishEvent(EntityChangeEvent.entityCreated("User", user))
    return user
  }
}
```

## DI registration

Register handlers in the module under `src/app/<feature>/module.ts` using Awilix. Use lowerCamelCase keys that end with `Handler`.

```ts
container.register({
  createUserHandler: asClass(CreateUserHandler).singleton(),
  getUserByIdHandler: asClass(GetUserByIdHandler).singleton(),
})
```

## Testing

- Handlers are covered by API integration tests in the feature’s `__tests__` folder.
- Keep handlers free of framework concerns; pass DTOs from the controller.
