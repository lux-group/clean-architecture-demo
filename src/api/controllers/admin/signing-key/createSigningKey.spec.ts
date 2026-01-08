import '@test/matchers/supertest';
import { getTestContext, TestContext } from '@test/integration/TestContext';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('[POST] /auth/v2/admin/signing-keys (CreateSigningKey)', () => {
  let context: TestContext;
  let accessToken: string;

  beforeAll(async () => {
    context = await getTestContext();
    accessToken = await context.createAccessToken('admin-user', ['signing-key:write']);
  });

  describe('when the creation was successful', () => {
    it('should return 201 with new signing key', async () => {
      const response = await request(context.server)
        .post('/auth/v2/admin/signing-keys')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(response.status).toBe(201);
      expect(response.body.result).toHaveProperty('id');
      expect(response.body.result).toHaveProperty('created_at');
      expect(response.body.result).toHaveProperty('updated_at');
      expect(response.body.result).toHaveProperty('public_key');
      expect(response.headers.location).toMatch(`/auth/v2/admin/signing-keys/${response.body.result.id}`);
    });
  });

  describe('when authorization fails', () => {
    it('should return 401 when no access token is provided', async () => {
      const response = await request(context.server).post('/auth/v2/admin/signing-keys').send();

      expect(response.status).toBe(401);
    });

    it("should return 403 when the access token does not have scope 'signing-keys:write'", async () => {
      const nonWriteAccessToken = await context.createAccessToken('admin-user', ['signing-key:read']);

      const response = await request(context.server)
        .post('/auth/v2/admin/signing-keys')
        .set('Authorization', `Bearer ${nonWriteAccessToken}`)
        .send();

      expect(response.status).toBe(403);
    });
  });
});
