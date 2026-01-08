import '@test/matchers/supertest';
import { randomUUID } from 'node:crypto';
import { getTestContext, TestContext } from '@test/integration/TestContext';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('[GET] /auth/v2/admin/identity-providers/:id (GetIdentityProviderById)', () => {
  let context: TestContext;
  let accessToken: string;

  beforeAll(async () => {
    context = await getTestContext();
    accessToken = await context.createAccessToken(randomUUID(), ['identity-provider:read']);
  });

  describe('when the identity provider exists', () => {
    it('should return 200 with the correct identity provider data', async () => {
      const identityProvider = await context.data.createIdentityProvider();

      const response = await request(context.server)
        .get(`/auth/v2/admin/identity-providers/${identityProvider.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(response.status).toBe(200);
      // Verify key fields and masked secret
      expect(response.body.result.id).toBe(identityProvider.id);
      expect(response.body.result.name).toBe(identityProvider.name);
      expect(response.body.result.issuer_url).toBe(identityProvider.issuerUrl);
      expect(response.body.result.audience).toBe(identityProvider.audience);
      expect(response.body.result.identifier_claim_name).toBe(identityProvider.identifierClaimName);
      if (identityProvider.authSettings) {
        const resp = response.body.result.auth_settings!;
        expect(resp.client_id).toBe(identityProvider.authSettings.clientId);
        expect(resp.client_secret.endsWith(identityProvider.authSettings.clientSecret.slice(-4))).toBe(true);
      }
    });
  });

  describe('when the identity provider does not exist', () => {
    it('should return 404', async () => {
      const response = await request(context.server)
        .get(`/auth/v2/admin/identity-providers/${randomUUID()}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send();

      expect(response.status).toBe(404);
    });
  });

  describe('when authorization fails', () => {
    it('should return 401 when no access token is provided', async () => {
      const identityProvider = await context.data.createIdentityProvider();

      const response = await request(context.server)
        .get(`/auth/v2/admin/identity-providers/${identityProvider.id}`)
        .send();

      expect(response.status).toBe(401);
    });

    it("should return 403 when the access token does not have scope 'identity-providers:read'", async () => {
      const identityProvider = await context.data.createIdentityProvider();
      const nonReadAccessToken = await context.createAccessToken(randomUUID(), ['foo:bar']);

      const response = await request(context.server)
        .get(`/auth/v2/admin/identity-providers/${identityProvider.id}`)
        .set('Authorization', `Bearer ${nonReadAccessToken}`)
        .send();

      expect(response.status).toBe(403);
    });
  });
});
