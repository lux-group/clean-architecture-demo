import { getTestContext, TestContext } from '@test/integration/TestContext';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { IdentityProvider } from '~/domain/entities';

describe('[POST] /auth/v2/external/sign-out-callback (ProcessSignOutResponse)', () => {
  let context: TestContext;
  let idp: IdentityProvider;

  beforeAll(async () => {
    context = await getTestContext();
    idp = await context.data.createIdentityProvider();
  });

  describe('when the request is valid', () => {
    it('should handle custom sign-in URL', async () => {
      const cookie = context.data.createAuthStateCookie(idp.authSettings!.redirectUrls[0], idp.id);

      const response = await request(context.server)
        .get('/auth/v2/external/sign-out-callback')
        .set('Cookie', [`auth-state=${cookie}`])
        .send();

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe(`${idp.authSettings!.redirectUrls[0]}/`);
    });
  });

  describe('when state is missing', () => {
    it('should return 401 error', async () => {
      const response = await request(context.server).get('/auth/v2/external/sign-out-callback').send();

      expect(response.status).toBe(401);
    });
  });
});
