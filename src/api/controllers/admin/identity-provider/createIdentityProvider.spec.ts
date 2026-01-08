import '@test/matchers/supertest';
import { randomUUID } from 'node:crypto';
import { getTestContext, TestContext } from '@test/integration/TestContext';
import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { EventPublisher } from '~/application/ports';

describe('[POST] /auth/v2/admin/identity-providers (CreateIdentityProvider)', () => {
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

  describe('when the creation was successful', () => {
    it('should return 201 with valid identity provider', async () => {
      const payload = getPayload();

      const response = await request(context.server)
        .post('/auth/v2/admin/identity-providers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload);

      expect(response.status).toBe(201);
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
      expect(response.headers.location).toMatch(`/auth/v2/admin/identity-providers/${response.body.result.id}`);
    });

    it('should create the identity provider in the database', async () => {
      const payload = getPayload();

      const response = await request(context.server)
        .post('/auth/v2/admin/identity-providers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload);

      const created = await context.data.getIdentityProvider(response.body.result.id);
      // Verify key fields match database and masking rules
      expect(response.body.result.id).toBe(created.id);
      expect(response.body.result.name).toBe(created.name);
      expect(response.body.result.issuer_url).toBe(created.issuerUrl);
      expect(response.body.result.audience).toBe(created.audience);
      expect(response.body.result.identifier_claim_name).toBe(created.identifierClaimName);
      if (created.authSettings) {
        const resp = response.body.result.auth_settings!;
        expect(resp.client_id).toBe(created.authSettings.clientId);
        // Masked secret: should end with the same last 4 chars
        expect(resp.client_secret.endsWith(created.authSettings.clientSecret.slice(-4))).toBe(true);
        expect(resp.redirect_urls).toEqual(created.authSettings.redirectUrls);
        expect(resp.auto_link_users).toBe(created.authSettings.autoLinkUsers);
        expect(resp.auto_create_users).toBe(created.authSettings.autoCreateUsers);
        expect(resp.session_lifetime_hours).toBe(created.authSettings.sessionLifetimeHours);
      }
    });

    it('should publish an event', async () => {
      const payload = getPayload();

      const eventPublisher: EventPublisher = context.container.resolve('eventPublisher');
      vi.spyOn(eventPublisher, 'publishEvent').mockImplementation(() => {});

      await request(context.server)
        .post('/auth/v2/admin/identity-providers')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(payload);

      expect(eventPublisher.publishEvent).toHaveBeenCalledOnce();
    });
  });

  describe('when authorization fails', () => {
    it('should return 401 when no access token is provided', async () => {
      const payload = getPayload();

      const response = await request(context.server).post('/auth/v2/admin/identity-providers').send(payload);

      expect(response.status).toBe(401);
    });

    it("should return 403 when the access token does not have scope 'identity-providers:write'", async () => {
      const payload = getPayload();
      const nonAdminAccessToken = await context.createAccessToken(randomUUID(), ['identity-provider:read']);

      const response = await request(context.server)
        .post('/auth/v2/admin/identity-providers')
        .set('Authorization', `Bearer ${nonAdminAccessToken}`)
        .send(payload);

      expect(response.status).toBe(403);
    });
  });
});
