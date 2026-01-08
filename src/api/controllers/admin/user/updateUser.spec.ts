import '@test/matchers/supertest';
import { randomUUID } from 'node:crypto';
import { getTestContext, TestContext } from '@test/integration/TestContext';
import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { EventPublisher } from '~/application/ports';

describe('[PUT] /auth/v2/admin/users/:id (UpdateUser)', () => {
  let context: TestContext;
  let accessToken: string;

  beforeAll(async () => {
    context = await getTestContext();
    accessToken = await context.createAccessToken(randomUUID(), ['user:write']);
  });

  const defaultPayload = {
    is_enabled: false,
    given_name: 'Updated Name',
    surname: 'Updated Surname',
    country: 'CA',
    city: 'Updated City',
    postcode: '54321',
    roles: ['admin', 'user'],
  };

  const getPayload = (overrides: Partial<typeof defaultPayload> = {}) => ({
    ...defaultPayload,
    ...overrides,
  });

  describe('when the update was successful', () => {
    it('should return 200 with updated user', async () => {
      const original = await context.data.createUser();
      const payload = getPayload();

      const response = await request(context.server)
        .put(`/auth/v2/admin/users/${original.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.result).toEqual(expect.objectContaining(payload));
    });

    it('should update the user in the database', async () => {
      const original = await context.data.createUser();
      const payload = getPayload();

      const response = await request(context.server)
        .put(`/auth/v2/admin/users/${original.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload);

      const updated = await context.data.getUser(original.id);
      expect(response).bodyToMatchEntity(updated);
    });

    it('should publish an event', async () => {
      const original = await context.data.createUser();
      const payload = getPayload();

      const eventPublisher: EventPublisher = context.container.resolve('eventPublisher');
      vi.spyOn(eventPublisher, 'publishEvent').mockImplementation(() => {});

      await request(context.server)
        .put(`/auth/v2/admin/users/${original.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload);

      expect(eventPublisher.publishEvent).toHaveBeenCalledOnce();
    });
  });

  describe('when the user does not exist', () => {
    it('should return 404', async () => {
      const payload = getPayload();

      const response = await request(context.server)
        .put(`/auth/v2/admin/users/${randomUUID()}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload);

      expect(response.status).toBe(404);
    });
  });

  describe('when authorization fails', () => {
    it('should return 401 when no access token is provided', async () => {
      const original = await context.data.createUser();
      const payload = getPayload();

      const response = await request(context.server).put(`/auth/v2/admin/users/${original.id}`).send(payload);

      expect(response.status).toBe(401);
    });

    it("should return 403 when the access token does not have scope 'users:write'", async () => {
      const original = await context.data.createUser();
      const payload = getPayload();
      const nonWriteAccessToken = await context.createAccessToken(randomUUID(), ['user:read']);

      const response = await request(context.server)
        .put(`/auth/v2/admin/users/${original.id}`)
        .set('Authorization', `Bearer ${nonWriteAccessToken}`)
        .send(payload);

      expect(response.status).toBe(403);
    });
  });
});
