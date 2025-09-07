# How to: Write a Use Case (Command/Query Handler)
## Introduction
Use cases orchestrate domain behavior. They are thin: build DTOs, call domain services/repositories, and publish events. We do not unit-test handlers in isolation; API integration tests cover them.

Related ADRs:
- [ADR-006](/docs/adr/006-cqrs-pattern-for-application-services.md) - CQRS Pattern for Application Services

## Structure
- Location: `src/app/modules/<feature>/{commands,queries}/<Name>Handler.ts`
- Naming: `Create<Name>Handler`, `Get<Name>ByIdHandler`
- Public API: `constructor(dependencies)` and `execute(dto): Promise<Result>`

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

Register handlers in the module under `src/app/modules/<feature>/module.ts` using Awilix. Use lowerCamelCase keys that end with `Handler`.

```ts
container.register({
  createUserHandler: asClass(CreateUserHandler).singleton(),
  getUserByIdHandler: asClass(GetUserByIdHandler).singleton(),
})
```

## Testing

Handlers are covered by [API integration tests](./writing-api-controllers.md).
