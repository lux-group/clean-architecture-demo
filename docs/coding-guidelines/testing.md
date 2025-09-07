# Testing
## General guidelines
- Write tests for all new features and bug fixes
- Ensure tests cover edge cases and error handling
- Avoid excessive mocking. If a piece of code cannot easily be tested in isolation, test a bigger scope.
- Keep tests clean and simple. Avoid excessive code duplication or over-specified assertions.
- Reuse mocks, factories, and matchers from the `/test` folder where possible.
- Use *vitest* for testing rather than *jest*. *vitest* is significantly faster, has better compatibility with modern TypeScript features like decorators, and does not require all the configuration workarounds that *jest* does.

## Unit Tests
This project demonstrates how clean architecture produces small modules that encapsulate self-contained business or utility logic, characterized by high cohesion and low coupling. This is a critical prerequisite for writing reliable and maintainable unit tests.

Some unit tests are solitary unit tests that only test a single function or class in isolation while others are sociable unit tests that test multiple classes together to provide more meaningful results and avoid excessive mocking. The test files are located next to the files they test and use the file suffix `.test.ts`.


This project contains unit tests for:
- [API Middleware](/src/app/shared/middleware)
- [Domain Entities](/src/domain/entities)
- [Infrastructure Services](/src/infrastructure)
- [Utility Libraries](/src/lib)

## Internal Integration Tests

The application does not utilise unit testing for areas that only contain orchestration logic, such as API controllers and application use cases (command and query handlers). These are tested with Internal Integration Tests instead that verify the behaviour of the entire application in isolation. For more information about how to write internal integration tests, refer to [How to: Write an API Controller](./writing-api-controllers.md#testing).

The application contains internal integration tests for all its modules.

- [identity-provider](/src/app/modules/admin/identity-provider/__tests__) Admin Controller
- [session](/src/app/modules/admin/session/__tests__) Admin Controller
- [signing-key](/src/app/modules/admin/signing-key/__tests__) Admin Controller
- [user](/src/app/modules/admin/user/__tests__) Admin Controller
- [external](/src/app/modules/authentication/external/__tests__) Authentication Controller
- [local](/src/app/modules/authentication/local/__tests__) Authentication Controller
- [token](/src/app/modules/authorization/token/__tests__) Authorization Controller
- [well-known](/src/app/modules/authorization/well-known/__tests__) Controller
