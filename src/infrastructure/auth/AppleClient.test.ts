import * as factories from '@test/factories';
import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiConfig, SignInState } from '~/application/ports';
import { IdentityProvider, IdentityProviderType } from '~/domain/entities';
import { AuthenticationError } from '~/domain/errors';
import { AppleClient } from './AppleClient';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AppleClient', () => {
  let appleClient: AppleClient;
  let identityProvider: IdentityProvider;
  let apiConfig: ApiConfig;

  const redirectUrl = 'https://app.example.com/callback';

  beforeEach(() => {
    vi.clearAllMocks();

    // Create test identity provider for Apple
    identityProvider = factories.createIdentityProvider({
      name: 'Apple',
      issuerUrl: 'https://appleid.apple.com',
      audience: 'apple-client-id',
      identifierClaimName: 'sub',
      authSettings: {
        type: IdentityProviderType.Apple,
        brand: 'apple',
        clientId: 'apple-client-id',
        clientSecret: 'apple-client-secret',
        redirectUrls: ['https://auth.example.com/auth/v2/external/sign-in-callback'],
        autoLinkUsers: false,
        autoCreateUsers: true,
      },
    });

    // Create API config
    apiConfig = {
      host: 'https://auth.example.com',
      basePath: '/auth/v2',
      adminBasePath: '/auth/v2/admin',
    };

    // Create Apple client
    appleClient = new AppleClient(apiConfig, identityProvider);
  });

  describe('constructor', () => {
    it('should create instance with correct properties', () => {
      expect(appleClient.supportsSignOut).toBe(false);
      expect(appleClient.supportsEditProfile).toBe(false);
    });
  });

  describe('createSignInRequest', () => {
    it('should create sign-in request with correct parameters', async () => {
      const result = await appleClient.createSignInRequest(redirectUrl);

      expect(result.url).toContain('https://appleid.apple.com/auth/authorize');
      expect(result.url).toContain('response_type=code');
      expect(result.url).toContain('client_id=apple-client-id');
      expect(result.url).toContain(
        'redirect_uri=https%3A%2F%2Fauth.example.com%2Fauth%2Fv2%2Fexternal%2Fsign-in-callback',
      );
      expect(result.url).toContain('scope=name+email');
      expect(result.url).toContain('response_mode=form_post');

      expect(result.signInState).toEqual({
        state: expect.any(String),
        nonce: expect.any(String),
        codeVerifier: expect.any(String),
        redirectUrl,
        identityProviderId: identityProvider.id,
      });

      // Verify that state and nonce are included in URL
      const url = new URL(result.url);
      expect(url.searchParams.get('state')).toBe(result.signInState.state);
      expect(url.searchParams.get('nonce')).toBe(result.signInState.nonce);
    });

    it('should generate random state, nonce, and code verifier', async () => {
      const result1 = await appleClient.createSignInRequest(redirectUrl);
      const result2 = await appleClient.createSignInRequest(redirectUrl);

      expect(result1.signInState.state).not.toBe(result2.signInState.state);
      expect(result1.signInState.nonce).not.toBe(result2.signInState.nonce);
      expect(result1.signInState.codeVerifier).not.toBe(result2.signInState.codeVerifier);
    });
  });

  describe('processSignInResponse', () => {
    let signInState: SignInState;
    let mockTokenResponse: any;
    let mockIdToken: string;

    beforeEach(() => {
      signInState = {
        state: 'test-state',
        nonce: 'test-nonce',
        codeVerifier: 'test-code-verifier',
        redirectUrl,
        identityProviderId: identityProvider.id,
      };

      mockTokenResponse = {
        id_token: 'mock-id-token',
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      };

      mockIdToken = jwt.sign(
        {
          iss: 'https://appleid.apple.com',
          aud: 'apple-client-id',
          sub: 'apple-user-123',
          email: 'test@example.com',
          nonce: 'test-nonce',
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        'secret',
      );

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          ...mockTokenResponse,
          id_token: mockIdToken,
        }),
      } as any);

      // Mock JWT decode
      vi.spyOn(jwt, 'decode').mockReturnValue({
        header: { alg: 'RS256', typ: 'JWT' },
        payload: {
          iss: 'https://appleid.apple.com',
          aud: 'apple-client-id',
          sub: 'apple-user-123',
          email: 'test@example.com',
          nonce: 'test-nonce',
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        signature: 'signature',
      } as jwt.Jwt);
    });

    it('should process successful sign-in response', async () => {
      const urlPath = '/auth/v2/external/sign-in-callback?code=auth-code&state=test-state';

      const result = await appleClient.processSignInResponse(signInState, urlPath);

      expect(mockFetch).toHaveBeenCalledWith('https://appleid.apple.com/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: expect.stringContaining('grant_type=authorization_code&code=auth-code'),
      });

      expect(result).toEqual({
        idToken: mockIdToken,
        refreshToken: 'mock-refresh-token',
        accessToken: 'mock-access-token',
        profile: {
          identifierClaimValue: 'apple-user-123',
          email: 'test@example.com',
          givenName: '',
          surname: '',
        },
      });
    });

    it('should process sign-in response with user data', async () => {
      const userData = JSON.stringify({
        name: {
          firstName: 'John',
          lastName: 'Doe',
        },
        email: 'john.doe@example.com',
      });
      const urlPath = `/auth/v2/external/sign-in-callback?code=auth-code&state=test-state&user=${encodeURIComponent(userData)}`;

      const result = await appleClient.processSignInResponse(signInState, urlPath);

      expect(result.profile).toEqual({
        identifierClaimValue: 'apple-user-123',
        email: 'john.doe@example.com', // From user param, which takes precedence
        givenName: 'John',
        surname: 'Doe',
      });
    });

    it('should throw error when authorization code is missing', async () => {
      const urlPath = '/auth/v2/external/sign-in-callback?state=test-state';

      await expect(appleClient.processSignInResponse(signInState, urlPath)).rejects.toThrow(AuthenticationError);

      await expect(appleClient.processSignInResponse(signInState, urlPath)).rejects.toThrow(
        'Authorization code not received from Apple',
      );
    });

    it('should throw error for invalid state', async () => {
      const urlPath = '/auth/v2/external/sign-in-callback?code=auth-code&state=wrong-state';

      await expect(appleClient.processSignInResponse(signInState, urlPath)).rejects.toThrow(AuthenticationError);

      await expect(appleClient.processSignInResponse(signInState, urlPath)).rejects.toThrow('Invalid state parameter');
    });

    it('should throw error when token exchange fails', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      } as any);

      const urlPath = '/auth/v2/external/sign-in-callback?code=auth-code&state=test-state';

      await expect(appleClient.processSignInResponse(signInState, urlPath)).rejects.toThrow(Error);

      await expect(appleClient.processSignInResponse(signInState, urlPath)).rejects.toThrow(
        'Token exchange failed: 400 Bad Request',
      );
    });

    it('should throw error for invalid nonce in ID token', async () => {
      vi.spyOn(jwt, 'decode').mockReturnValue({
        header: { alg: 'RS256', typ: 'JWT' },
        payload: {
          iss: 'https://appleid.apple.com',
          aud: 'apple-client-id',
          sub: 'apple-user-123',
          email: 'test@example.com',
          nonce: 'wrong-nonce',
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        signature: 'signature',
      } as jwt.Jwt);

      const urlPath = '/auth/v2/external/sign-in-callback?code=auth-code&state=test-state';

      await expect(appleClient.processSignInResponse(signInState, urlPath)).rejects.toThrow(Error);

      await expect(appleClient.processSignInResponse(signInState, urlPath)).rejects.toThrow(
        'Invalid nonce in ID token',
      );
    });

    it('should throw error for invalid issuer', async () => {
      vi.spyOn(jwt, 'decode').mockReturnValue({
        header: { alg: 'RS256', typ: 'JWT' },
        payload: {
          iss: 'https://wrong-issuer.com',
          aud: 'apple-client-id',
          sub: 'apple-user-123',
          email: 'test@example.com',
          nonce: 'test-nonce',
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        signature: 'signature',
      } as jwt.Jwt);

      const urlPath = '/auth/v2/external/sign-in-callback?code=auth-code&state=test-state';

      await expect(appleClient.processSignInResponse(signInState, urlPath)).rejects.toThrow(Error);

      await expect(appleClient.processSignInResponse(signInState, urlPath)).rejects.toThrow(
        'Invalid issuer in ID token',
      );
    });

    it('should throw error for invalid audience', async () => {
      vi.spyOn(jwt, 'decode').mockReturnValue({
        header: { alg: 'RS256', typ: 'JWT' },
        payload: {
          iss: 'https://appleid.apple.com',
          aud: 'wrong-client-id',
          sub: 'apple-user-123',
          email: 'test@example.com',
          nonce: 'test-nonce',
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        signature: 'signature',
      } as jwt.Jwt);

      const urlPath = '/auth/v2/external/sign-in-callback?code=auth-code&state=test-state';

      await expect(appleClient.processSignInResponse(signInState, urlPath)).rejects.toThrow(Error);

      await expect(appleClient.processSignInResponse(signInState, urlPath)).rejects.toThrow(
        'Invalid audience in ID token',
      );
    });

    it('should throw error when required profile information is missing', async () => {
      vi.spyOn(jwt, 'decode').mockReturnValue({
        header: { alg: 'RS256', typ: 'JWT' },
        payload: {
          iss: 'https://appleid.apple.com',
          aud: 'apple-client-id',
          sub: 'apple-user-123',
          // missing email
          nonce: 'test-nonce',
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        signature: 'signature',
      } as jwt.Jwt);

      const urlPath = '/auth/v2/external/sign-in-callback?code=auth-code&state=test-state';

      await expect(appleClient.processSignInResponse(signInState, urlPath)).rejects.toThrow(Error);

      await expect(appleClient.processSignInResponse(signInState, urlPath)).rejects.toThrow(
        'Required profile information not available',
      );
    });

    it('should handle malformed user data gracefully', async () => {
      const urlPath = '/auth/v2/external/sign-in-callback?code=auth-code&state=test-state&user=invalid-json';

      const result = await appleClient.processSignInResponse(signInState, urlPath);

      // Should still work with profile from ID token only
      expect(result.profile).toEqual({
        identifierClaimValue: 'apple-user-123',
        email: 'test@example.com',
        givenName: '',
        surname: '',
      });
    });

    it('should handle invalid ID token format', async () => {
      vi.spyOn(jwt, 'decode').mockReturnValue(null);

      const urlPath = '/auth/v2/external/sign-in-callback?code=auth-code&state=test-state';

      await expect(appleClient.processSignInResponse(signInState, urlPath)).rejects.toThrow(Error);

      await expect(appleClient.processSignInResponse(signInState, urlPath)).rejects.toThrow('Invalid ID token format');
    });
  });

  describe('createSignOutRequest', () => {
    it("should throw error as Apple doesn't support sign-out", async () => {
      await expect(appleClient.createSignOutRequest(redirectUrl)).rejects.toThrow(
        'The identity provider does not support single-sign-out.',
      );
    });
  });

  describe('checkSessionWithRefreshToken', () => {
    it("should throw error as Apple doesn't support refresh tokens", async () => {
      await expect(appleClient.checkSessionWithRefreshToken('refresh-token')).rejects.toThrow(
        'The identity provider does not support refresh tokens.',
      );
    });
  });

  describe('editProfile', () => {
    it("should throw error as Apple doesn't support profile editing", async () => {
      await expect(appleClient.editProfile('access-token', 'John', 'Doe')).rejects.toThrow(
        'The identity provider does not support editing profiles.',
      );
    });
  });

  describe('error handling', () => {
    it('should propagate fetch errors during token exchange', async () => {
      const signInState: SignInState = {
        state: 'test-state',
        nonce: 'test-nonce',
        codeVerifier: 'test-code-verifier',
        redirectUrl,
        identityProviderId: identityProvider.id,
      };

      mockFetch.mockRejectedValue(new Error('Network error'));

      const urlPath = '/auth/v2/external/sign-in-callback?code=auth-code&state=test-state';

      await expect(appleClient.processSignInResponse(signInState, urlPath)).rejects.toThrow('Network error');
    });

    it('should handle JWT decode errors', async () => {
      const signInState: SignInState = {
        state: 'test-state',
        nonce: 'test-nonce',
        codeVerifier: 'test-code-verifier',
        redirectUrl,
        identityProviderId: identityProvider.id,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          id_token: 'invalid-jwt',
        }),
      } as any);

      vi.spyOn(jwt, 'decode').mockImplementation(() => {
        throw new Error('JWT decode error');
      });

      const urlPath = '/auth/v2/external/sign-in-callback?code=auth-code&state=test-state';

      await expect(appleClient.processSignInResponse(signInState, urlPath)).rejects.toThrow(Error);
      await expect(appleClient.processSignInResponse(signInState, urlPath)).rejects.toThrow('JWT decode error');
    });
  });
});
