import '@test/matchers/supertest';
import { randomUUID } from 'node:crypto';
import { getTestContext, TestContext } from '@test/integration/TestContext';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('[GET] /admin/v2/users/:id (GetUserById)', () => {
  let context: TestContext;
  let accessToken: string;

  beforeAll(async () => {
    context = await getTestContext();
    accessToken = await context.createAccessToken(randomUUID(), ['user:read']);
  });

  describe('when the user exists', () => {
    it('should return 200 with the correct user data', async () => {
      const user = await context.data.createUser();

      const response = await request(context.server)
        .get(`/admin/v2/users/${user.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(response.status).toBe(200);
      expect(response).bodyToMatchEntity(user);
    });
  });

  describe('when the user does not exist', () => {
    it('should return 404', async () => {
      const response = await request(context.server)
        .get(`/admin/v2/users/${randomUUID()}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(response.status).toBe(404);
    });
  });

  describe('when authorization fails', () => {
    it('should return 401 when no access token is provided', async () => {
      const user = await context.data.createUser();

      const response = await request(context.server).get(`/admin/v2/users/${user.id}`).send();

      expect(response.status).toBe(401);
    });

    it("should return 403 when the access token does not have scope 'users:read'", async () => {
      const user = await context.data.createUser();
      const nonReadAccessToken = await context.createAccessToken(randomUUID(), ['foo:bar']);

      const response = await request(context.server)
        .get(`/admin/v2/users/${user.id}`)
        .set('Authorization', `Bearer ${nonReadAccessToken}`)
        .send();

      expect(response.status).toBe(403);
    });
  });
});
