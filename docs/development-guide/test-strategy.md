# Test Strategy
## Unit Tests
This project demonstrates how clean architecture produces small modules that encapsulate self-contained business or utility logic, characterized by high cohesion and low coupling. This is a critical prerequisite for writing reliable and maintainable unit tests.

This project contains unit tests for:
- [API Middleware](/src/app/shared/middleware) (solitary)
- [Domain Entities](/src/domain/entities) (solitary)
- [Domain Services](/src/domain/services) (sociable)
- [Infrastructure Services](/src/infrastructure) (solitary)
- [Utility Libraries](/src/lib) (solitary)

## Integration Tests
### Internal Integration Tests

The application does not utilise unit testing for areas that only contain orchestration logic, such as API controllers and application use cases (command and query handlers). These are tested with Internal Integration Tests instead that verify the behaviour of the entire application in isolation.

- [identity-provider](/src/app/admin/identity-provider/__tests__) Admin Controller
- [session](/src/app/admin/session/__tests__) Admin Controller
- [signing-Key](/src/app/admin/signing-key/__tests__) Admin Controller
- [user](/src/app/admin/user/__tests__) Admin Controller
- [external](/src/app/authentication/external/__tests__) Authentication Controller
- [local](/src/app/authentication/local/__tests__) Authetication Controller
- [token](/src/app/authorization/token/__tests__) Authorization Controller
- [well-known](/src/app/authorization/well-known/__tests__) Controller

### External Integration Tests
External Integration Tests verify the behaviour of integrations with external services or infrastructure in isolation. The application contains two examples for Prisma (Postgres) and Redis.

- [Prisma](/src/infrastructure/repositories/prisma/__tests__) Repositories
- [Redis](/src/infrastructure/repositories/redis/__tests__) Repositories
