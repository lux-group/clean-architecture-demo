import '@test/matchers/supertest';
import { randomUUID } from 'node:crypto';
import { getTestContext, TestContext } from '@test/integration/TestContext';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('[GET] /v2/profiles (GetProfile)', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await getTestContext();
  });

  describe('when the profile exists', () => {
    it('should return 200 with the correct profile data', async () => {
      const user = await context.data.createUser();
      const accessToken = await context.createAccessToken(user.id, []);

      const response = await request(context.server)
        .get('/v2/profiles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(response.status).toBe(200);
      expect(response).bodyToMatchEntity(user);
    });
  });

  describe('when the profile does not exist', () => {
    it('should return 404', async () => {
      const accessToken = await context.createAccessToken(randomUUID(), []);

      const response = await request(context.server)
        .get('/v2/profiles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(response.status).toBe(404);
    });
  });

  describe('when the user is not authorized', () => {
    it('should return 401', async () => {
      const response = await request(context.server).get('/v2/profiles').send();

      expect(response.status).toBe(401);
    });
  });
});
