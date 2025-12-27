import { getTestContext, TestContext } from '@test/integration/TestContext';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('[GET] /auth/v2/.well-known/openid-configuration (GetOpenidConfiguration)', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await getTestContext();
  });

  describe('when requesting OpenID configuration', () => {
    it('should return 200 with valid configuration', async () => {
      const response = await request(context.server).get('/auth/v2/.well-known/openid-configuration').send();

      expect(response.status).toBe(200);
      expect(response.body.jwks_uri).toMatch(/\.well-known\/jwks$/);
    });
  });
});
