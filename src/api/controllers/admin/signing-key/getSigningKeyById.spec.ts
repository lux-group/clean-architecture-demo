import '@test/matchers/supertest';
import { randomUUID } from 'node:crypto';
import { getTestContext, TestContext } from '@test/integration/TestContext';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('[GET] /admin/v2/signing-keys/:id (GetSigningKeyById)', () => {
  let context: TestContext;
  let accessToken: string;

  beforeAll(async () => {
    context = await getTestContext();
    accessToken = await context.createAccessToken(randomUUID(), ['signing-key:read']);
  });

  describe('when the signing key exists', () => {
    it('should return 200 with the correct signing key data', async () => {
      const signingKey = await context.data.createSigningKey();

      const response = await request(context.server)
        .get(`/admin/v2/signing-keys/${signingKey.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(response.status).toBe(200);
      expect(response).bodyToMatchEntity(signingKey);
    });
  });

  describe('when the signing key does not exist', () => {
    it('should return 404', async () => {
      const response = await request(context.server)
        .get(`/admin/v2/signing-keys/${randomUUID()}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(response.status).toBe(404);
    });
  });

  describe('when authorization fails', () => {
    it('should return 401 when no access token is provided', async () => {
      const signingKey = await context.data.createSigningKey();

      const response = await request(context.server).get(`/admin/v2/signing-keys/${signingKey.id}`).send();

      expect(response.status).toBe(401);
    });

    it("should return 403 when the access token does not have scope 'signing-keys:read'", async () => {
      const signingKey = await context.data.createSigningKey();
      const nonReadAccessToken = await context.createAccessToken(randomUUID(), ['foo:bar']);

      const response = await request(context.server)
        .get(`/admin/v2/signing-keys/${signingKey.id}`)
        .set('Authorization', `Bearer ${nonReadAccessToken}`)
        .send();

      expect(response.status).toBe(403);
    });
  });
});
