import { generateKeyPairSync } from 'node:crypto';
import { mockSigningKeyRepository } from '@test/mocks';
import jwt from 'jsonwebtoken';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { TokenIssuer, TokenRequest, TokenVersion } from '~/application/ports';
import { SigningKey } from '~/domain/entities';
import { JsonWebTokenIssuer } from './JsonWebTokenIssuer';

describe('JsonWebTokenIssuer', () => {
  let tokenIssuer: TokenIssuer;
  let baseTokenRequest: TokenRequest;
  let signingKey: SigningKey;

  const baseUrl = 'https://auth.example.com';
  const lifetimeSeconds = 3600;
  const audience = 'test-audience';

  beforeAll(() => {
    const { privateKey: priv, publicKey: pub } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    signingKey = SigningKey.createNew({
      privateKey: priv,
      publicKey: pub,
    });
  });

  beforeEach(() => {
    tokenIssuer = new JsonWebTokenIssuer(
      baseUrl,
      { path: '/auth/v2', lifetimeSeconds, audience },
      mockSigningKeyRepository,
    );

    baseTokenRequest = {
      version: TokenVersion.V2,
      userId: 'user123',
      sessionId: 'session123',
      scopes: ['read', 'write'],
      customClaims: { customClaim: 'customValue' },
    };

    (mockSigningKeyRepository.tryGetActiveSigningKey as ReturnType<typeof vi.fn>).mockResolvedValue(signingKey);
  });

  describe('createAccessToken V1', () => {
    const decodeToken = (token: string) => {
      return jwt.verify(token, signingKey.publicKey, { algorithms: ['RS256'] }) as jwt.JwtPayload;
    };

    it('should create a valid access token with correct structure', async () => {
      const result = await tokenIssuer.createAccessToken({ ...baseTokenRequest, version: TokenVersion.V1 });

      expect(result.expiresIn).toBe(lifetimeSeconds);
      expect(typeof result.accessToken).toBe('string');

      const decoded = decodeToken(result.accessToken);
      expect(decoded.ver).toBe('1.0');
      expect(decoded.jti).toBeDefined();
      expect(decoded.sub).toBe(baseTokenRequest.userId);
      expect(decoded.customClaim).toBe('customValue');
      expect(typeof decoded.iat).toBe('number');
      expect(typeof decoded.exp).toBe('number');
      expect(decoded.exp! - decoded.iat!).toBe(lifetimeSeconds * 1000);
    });
  });

  describe('createAccessToken V2', () => {
    const decodeToken = (token: string) => {
      return jwt.verify(token, signingKey.publicKey, { algorithms: ['RS256'] }) as jwt.JwtPayload;
    };

    it('should create a valid access token with correct structure', async () => {
      const result = await tokenIssuer.createAccessToken(baseTokenRequest);

      expect(result.expiresIn).toBe(lifetimeSeconds);
      expect(typeof result.accessToken).toBe('string');

      const decoded = decodeToken(result.accessToken);
      expect(decoded.ver).toBe('2.0');
      expect(decoded.jti).toBeDefined();
      expect(decoded.iss).toBe(`${baseUrl}/auth/v2`);
      expect(decoded.aud).toBe(audience);
      expect(decoded.sub).toBe(baseTokenRequest.userId);
      expect(decoded.sid).toBe(baseTokenRequest.sessionId);
      expect(decoded.scope).toBe('read write');
      expect(decoded.customClaim).toBe('customValue');
      expect(typeof decoded.iat).toBe('number');
      expect(typeof decoded.exp).toBe('number');
      expect(decoded.exp! - decoded.iat!).toBe(lifetimeSeconds);
    });

    it('should use custom audience when provided in request', async () => {
      const customAudience = 'custom-audience';
      const request = { ...baseTokenRequest, audience: customAudience };

      const result = await tokenIssuer.createAccessToken(request);
      const decoded = decodeToken(result.accessToken);

      expect(decoded.aud).toBe(customAudience);
    });

    it('should handle request without scopes', async () => {
      const request = { ...baseTokenRequest, scopes: undefined };

      const result = await tokenIssuer.createAccessToken(request);
      const decoded = decodeToken(result.accessToken);

      expect(decoded.scope).toBeUndefined();
    });

    it('should handle empty scopes array', async () => {
      const request = { ...baseTokenRequest, scopes: [] };

      const result = await tokenIssuer.createAccessToken(request);
      const decoded = decodeToken(result.accessToken);

      expect(decoded.scope).toBe('');
    });

    it('should handle request without sessionId', async () => {
      const request = { ...baseTokenRequest, sessionId: undefined };

      const result = await tokenIssuer.createAccessToken(request);
      const decoded = decodeToken(result.accessToken);

      expect(decoded.sid).toBeUndefined();
    });

    it('should include all custom claims in the token payload', async () => {
      const request = {
        ...baseTokenRequest,
        customClaims: {
          stringClaim: 'value1',
          numberClaim: 42,
          booleanClaim: true,
          nestedClaim: { nested: 'value' },
        },
      };

      const result = await tokenIssuer.createAccessToken(request);
      const decoded = decodeToken(result.accessToken);

      expect(decoded.stringClaim).toBe('value1');
      expect(decoded.numberClaim).toBe(42);
      expect(decoded.booleanClaim).toBe(true);
      expect(decoded.nestedClaim).toEqual({ nested: 'value' });
    });

    it('should have expiration time greater than issued time', async () => {
      const before = Math.floor(Date.now() / 1000);
      const result = await tokenIssuer.createAccessToken(baseTokenRequest);
      const after = Math.floor(Date.now() / 1000) + 1; // Add 1 second buffer for timing

      const decoded = decodeToken(result.accessToken);

      expect(decoded.iat).toBeGreaterThanOrEqual(before);
      expect(decoded.iat).toBeLessThanOrEqual(after);
      expect(decoded.exp).toBe(decoded.iat! + lifetimeSeconds);
    });

    it('should generate unique JTI for each token', async () => {
      const result1 = await tokenIssuer.createAccessToken(baseTokenRequest);
      const result2 = await tokenIssuer.createAccessToken(baseTokenRequest);

      const decoded1 = decodeToken(result1.accessToken);
      const decoded2 = decodeToken(result2.accessToken);

      expect(decoded1.jti).not.toBe(decoded2.jti);
    });
  });
});
