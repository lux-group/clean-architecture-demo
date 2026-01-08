import '@test/matchers/supertest';
import { randomUUID } from 'node:crypto';
import { getTestContext, TestContext } from '@test/integration/TestContext';
import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { EventPublisher } from '~/application/ports';

describe('[PATCH] /auth/v2/admin/identity-providers/:id (UpdateIdentityProvider)', () => {
  let context: TestContext;
  let accessToken: string;

  const getPayload = () => ({
    name: randomUUID(),
    issuer_url: 'https://updated.test.com',
    audience: randomUUID(),
    identifier_claim_name: 'updated',
    auth_settings: {
      type: 'ENTRA',
      brand: 'Test Brand updated',
      client_id: randomUUID(),
      client_secret: randomUUID(),
      redirect_urls: ['https://test.updated.com'],
      auto_link_users: true,
      auto_create_users: true,
      session_lifetime_hours: 12,
    },
  });

  beforeAll(async () => {
    context = await getTestContext();
    accessToken = await context.createAccessToken(randomUUID(), ['identity-provider:write']);
  });

  describe('when the update was successful', () => {
    it('should return 200 with valid identity provider', async () => {
      const original = await context.data.createIdentityProvider();
      const payload = getPayload();

      const response = await request(context.server)
        .patch(`/auth/v2/admin/identity-providers/${original.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.result.name).toBe(payload.name);
      expect(response.body.result.issuer_url).toBe(payload.issuer_url);
      expect(response.body.result.audience).toBe(payload.audience);
      expect(response.body.result.identifier_claim_name).toBe(payload.identifier_claim_name);
      expect(response.body.result.auth_settings.type).toBe(payload.auth_settings.type);
      expect(response.body.result.auth_settings.brand).toBe(payload.auth_settings.brand);
      expect(response.body.result.auth_settings.client_id).toBe(payload.auth_settings.client_id);
      expect(typeof response.body.result.auth_settings.client_secret).toBe('string');
      expect(
        response.body.result.auth_settings.client_secret.endsWith(payload.auth_settings.client_secret.slice(-4)),
      ).toBe(true);
      expect(response.body.result.auth_settings.redirect_urls).toEqual(payload.auth_settings.redirect_urls);
      expect(response.body.result.auth_settings.auto_link_users).toBe(payload.auth_settings.auto_link_users);
      expect(response.body.result.auth_settings.auto_create_users).toBe(payload.auth_settings.auto_create_users);
      expect(response.body.result.auth_settings.session_lifetime_hours).toBe(
        payload.auth_settings.session_lifetime_hours,
      );
    });

    it('should update the identity provider in the database', async () => {
      const original = await context.data.createIdentityProvider();
      const payload = getPayload();

      const response = await request(context.server)
        .patch(`/auth/v2/admin/identity-providers/${original.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload);

      const updated = await context.data.getIdentityProvider(original.id);
      // Verify key fields match database and masking rules
      expect(response.body.result.id).toBe(updated.id);
      expect(response.body.result.name).toBe(updated.name);
      expect(response.body.result.issuer_url).toBe(updated.issuerUrl);
      expect(response.body.result.audience).toBe(updated.audience);
      expect(response.body.result.identifier_claim_name).toBe(updated.identifierClaimName);
      if (updated.authSettings) {
        const resp = response.body.result.auth_settings!;
        expect(resp.client_id).toBe(updated.authSettings.clientId);
        // Masked secret: should end with the same last 4 chars
        expect(resp.client_secret.endsWith(updated.authSettings.clientSecret.slice(-4))).toBe(true);
        expect(resp.redirect_urls).toEqual(updated.authSettings.redirectUrls);
        expect(resp.auto_link_users).toBe(updated.authSettings.autoLinkUsers);
        expect(resp.auto_create_users).toBe(updated.authSettings.autoCreateUsers);
        expect(resp.session_lifetime_hours).toBe(updated.authSettings.sessionLifetimeHours);
      }
    });

    it('should publish an event', async () => {
      const original = await context.data.createIdentityProvider();
      const payload = getPayload();

      const eventPublisher: EventPublisher = context.container.resolve('eventPublisher');
      vi.spyOn(eventPublisher, 'publishEvent').mockImplementation(() => {});

      await request(context.server)
        .patch(`/auth/v2/admin/identity-providers/${original.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload);

      expect(eventPublisher.publishEvent).toHaveBeenCalledOnce();
    });
  });

  describe('when the identity provider does not exist', () => {
    it('should return 404', async () => {
      const response = await request(context.server)
        .delete(`/auth/v2/admin/identity-providers/${randomUUID()}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(response.status).toBe(404);
    });
  });

  describe('when authorization fails', () => {
    it('should return 401 when no access token is provided', async () => {
      const original = await context.data.createIdentityProvider();
      const payload = getPayload();

      const response = await request(context.server).patch(`/auth/v2/admin/identity-providers/${original.id}`).send(payload);

      expect(response.status).toBe(401);
    });

    it("should return 403 when the access token does not have scope 'identity-providers:write'", async () => {
      const original = await context.data.createIdentityProvider();
      const payload = getPayload();
      const nonWriteAccessToken = await context.createAccessToken(randomUUID(), ['identity-provider:read']);

      const response = await request(context.server)
        .patch(`/auth/v2/admin/identity-providers/${original.id}`)
        .set('Authorization', `Bearer ${nonWriteAccessToken}`)
        .send(payload);

      expect(response.status).toBe(403);
    });
  });
});
