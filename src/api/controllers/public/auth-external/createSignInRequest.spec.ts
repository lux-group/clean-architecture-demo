import { getTestContext, TestContext } from '@test/integration/TestContext';
import { mockAuthClient } from '@test/mocks';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { IdentityProvider } from '~/domain/entities';

describe('[POST] /auth/v2/external/sign-in (CreateSignInRequest)', () => {
  let context: TestContext;
  let idp: IdentityProvider;

  beforeAll(async () => {
    context = await getTestContext();
    idp = await context.data.createIdentityProvider();
  });

  beforeEach(() => {
    const authClientFactory = context.container.resolve('authClientFactory');
    vi.spyOn(authClientFactory, 'createClient').mockReturnValue(mockAuthClient);
    vi.clearAllMocks();
  });

  describe('when the request is valid', () => {
    it('should redirect to IDP and set state cookie', async () => {
      mockAuthClient.createSignInRequest = vi.fn().mockImplementation(redirectUrl =>
        Promise.resolve({
          url: 'https://custom.provider.com/auth',
          signInState: {
            state: 'unused',
            nonce: 'unused',
            codeVerifier: 'unused',
            identityProviderId: 'unused',
            redirectUrl,
          },
        }),
      );

      const response = await request(context.server)
        .get(`/auth/v2/external/sign-in?redirect_uri=${idp.authSettings?.redirectUrls[0]}&provider=${idp.name}`)
        .send();

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('https://custom.provider.com/auth');
      expect(response.headers['set-cookie']).toEqual(
        expect.arrayContaining([expect.stringMatching(/auth-state=.*HttpOnly; Secure;/)]),
      );
    });
  });

  describe('when redirect_uri is missing', () => {
    it('should return 400', async () => {
      const response = await request(context.server).get(`/auth/v2/external/sign-in?provider=${idp.name}`).send();

      expect(response.status).toBe(400);
    });
  });

  describe('when redirect_uri is not allowed', () => {
    it('should return 400', async () => {
      const response = await request(context.server)
        .get(`/auth/v2/external/sign-in?redirect_uri=https://host.com/not-allowed&provider=${idp.name}`)
        .send();

      expect(response.status).toBe(400);
    });
  });

  describe('when provider is not provided', () => {
    it('should return 400', async () => {
      const response = await request(context.server)
        .get(`/auth/v2/external/sign-in?redirect_uri=${idp.authSettings?.redirectUrls[0]}`)
        .send();

      expect(response.status).toBe(400);
    });
  });

  describe('when provider does not exist', () => {
    it('should return 400', async () => {
      const response = await request(context.server)
        .get(`/auth/v2/external/sign-in?redirect_uri=${idp.authSettings?.redirectUrls[0]}&provider=invalid`)
        .send();

      expect(response.status).toBe(400);
    });
  });

  describe('when provider has no auth settings', () => {
    it('should return 400', async () => {
      const idp = await context.data.createIdentityProvider({ authSettings: null });

      const response = await request(context.server)
        .get(`/auth/v2/external/sign-in?redirect_uri=${idp.authSettings?.redirectUrls[0]}&provider=invalid`)
        .send();

      expect(response.status).toBe(400);
    });
  });
});
