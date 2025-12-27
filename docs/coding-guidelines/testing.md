# Testing

## General guidelines

- Write tests for all new features and bug fixes
- Ensure tests cover edge cases and error handling
- Avoid excessive mocking. If a piece of code cannot easily be tested in isolation, test a bigger scope.
- Keep tests clean and simple. Avoid excessive code duplication or over-specified assertions.
- Reuse mocks, factories, and matchers from the `/test` folder where possible.
- Use *vitest* for testing rather than *jest*. *vitest* is significantly faster, has better compatibility with modern TypeScript features, and does not require all the configuration workarounds that *jest* does.

## Unit Tests

This project demonstrates how clean architecture produces small modules that encapsulate self-contained business or utility logic, characterized by high cohesion and low coupling. This is a critical prerequisite for writing reliable and maintainable unit tests.

Some unit tests are solitary unit tests that only test a single function or class in isolation while others are sociable unit tests that test multiple classes together to provide more meaningful results and avoid excessive mocking. The test files are located next to the files they test and use the file suffix `.test.ts`.

This project contains unit tests for:
- [API Middleware](/src/api/middleware)
- [Domain Entities](/src/domain/entities)
- [Infrastructure Services](/src/infrastructure)
- [Utility Libraries](/src/lib)

## Internal Integration Tests

The application does not utilise unit testing for areas that only contain orchestration logic, such as API endpoints and application use cases (command and query handlers). These are tested with Internal Integration Tests instead that verify the behaviour of the entire application in isolation.

Integration tests are co-located with their endpoint implementations using the `.spec.ts` suffix. For example:
- `src/api/controllers/admin/user/createUser.spec.ts`
- `src/api/controllers/admin/identity-provider/createIdentityProvider.spec.ts`

For more information about how to write internal integration tests, refer to [How to: Write API Endpoints](./writing-api-controllers.md#testing).

The application contains internal integration tests for all its modules:

### Admin Controllers
- [identity-provider](/src/api/controllers/admin/identity-provider) - CRUD operations for identity providers
- [session](/src/api/controllers/admin/session) - Session management
- [signing-key](/src/api/controllers/admin/signing-key) - Signing key management
- [user](/src/api/controllers/admin/user) - User management

### Public Controllers
- [auth-external](/src/api/controllers/public/auth-external) - External identity provider authentication
- [auth-local](/src/api/controllers/public/auth-local) - Local authentication with email/password
- [profile](/src/api/controllers/public/profile) - User profile
- [token](/src/api/controllers/public/token) - Token issuance and OIDC metadata

## Test File Conventions

- **Unit tests**: `.test.ts` suffix, located next to the file being tested
- **Integration tests**: `.spec.ts` suffix, co-located with endpoint implementations
- **Test helpers**: Located in `/test` folder with `@test/` import alias

## Example Integration Test

```ts
import '@test/matchers/supertest';
import { randomUUID } from 'node:crypto';
import { getTestContext, TestContext } from '@test/integration/TestContext';
import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { EventPublisher } from '~/application/ports';

describe('[POST] /admin/v2/identity-providers (CreateIdentityProvider)', () => {
  let context: TestContext;
  let accessToken: string;

  const getPayload = () => ({
    name: randomUUID(),
    issuer_url: 'https://test.com',
    audience: randomUUID(),
    identifier_claim_name: 'sub',
    auth_settings: null,
  });

  beforeAll(async () => {
    context = await getTestContext();
    accessToken = await context.createAccessToken(randomUUID(), ['identity-provider:write']);
  });

  describe('when the creation was successful', () => {
    it('should return 201 with valid identity provider', async () => {
      const payload = getPayload();

      const response = await request(context.server)
        .post('/admin/v2/identity-providers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.result).toEqual(expect.objectContaining(payload));
    });

    it('should publish an event', async () => {
      const payload = getPayload();
      const eventPublisher: EventPublisher = context.container.resolve('eventPublisher');
      vi.spyOn(eventPublisher, 'publishEvent').mockImplementation(() => {});

      await request(context.server)
        .post('/admin/v2/identity-providers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload);

      expect(eventPublisher.publishEvent).toHaveBeenCalledOnce();
    });
  });

  describe('when authorization fails', () => {
    it('should return 401 when no access token is provided', async () => {
      const response = await request(context.server)
        .post('/admin/v2/identity-providers')
        .send(getPayload());

      expect(response.status).toBe(401);
    });
  });
});
```
