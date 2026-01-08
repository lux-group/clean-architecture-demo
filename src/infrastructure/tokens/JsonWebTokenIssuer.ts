import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { ApiConfig, TokenIssuer, TokenIssuerConfig, TokenRequest, TokenResponse, TokenVersion } from '~/application/ports';
import { SigningKeyRepository } from '~/domain/repositories';
import { UUIDToShort } from '~/lib/ShortUUID';

export class JsonWebTokenIssuer implements TokenIssuer {
  constructor(
    private readonly apiConfig: ApiConfig,
    private readonly tokenIssuerConfig: TokenIssuerConfig,
    private readonly signingKeyRepository: SigningKeyRepository,
  ) {}

  async createAccessToken(request: TokenRequest): Promise<TokenResponse> {
    const signingKey = await this.signingKeyRepository.tryGetActiveSigningKey();
    if (!signingKey || !signingKey.privateKey) {
      throw new Error('No active signing key found.');
    }

    let claims: Record<string, unknown> | undefined;
    switch (request.version) {
      case TokenVersion.V1:
        claims = this.createV1Claims(request);
        break;
      case TokenVersion.V2:
        claims = this.createV2Claims(request);
        break;
      default:
        throw new Error('Unsupported token version.');
    }

    // We shorten the key ID to save a few bytes.
    // Make sure the same thing is done in the JWKS endpoint.
    const kid = UUIDToShort(signingKey.id);

    const accessToken = jwt.sign(claims, signingKey.privateKey!, { algorithm: 'RS256', keyid: kid });

    return { accessToken, expiresIn: this.tokenIssuerConfig.lifetimeSeconds, claims };
  }

  private createV1Claims(request: TokenRequest): Record<string, unknown> {
    // Important notes about V1:
    // - Issues times in milliseconds instead of seconds.
    // - Uses the service name instead of URL in the issuer field. The implementation below
    //   uses the audience from the config as the issuer but we need to review this.
    // - Abuses the audience field for impersonation.

    const iat = Date.now();
    const exp = iat + this.tokenIssuerConfig.lifetimeSeconds * 1000;

    return {
      ver: '1.0',
      jti: randomUUID(),
      iss: this.tokenIssuerConfig.audience,
      sub: request.userId,
      iat,
      exp,
      aud: request.impersonatedByUserId,
      ...request.customClaims,
    };
  }

  private createV2Claims(request: TokenRequest): Record<string, unknown> {
    const iat = Math.round(Date.now() / 1000);
    const exp = iat + this.tokenIssuerConfig.lifetimeSeconds;

    return {
      ver: '2.0',
      jti: UUIDToShort(randomUUID()),
      iss: this.apiConfig.host + this.apiConfig.basePath + this.tokenIssuerConfig.path,
      aud: request.audience ?? this.tokenIssuerConfig.audience,
      sub: request.userId,
      sid: request.sessionId,
      iat,
      exp,
      scope: request.scopes?.join(' '),
      act: request.impersonatedByUserId
        ? {
            sub: request.impersonatedByUserId,
          }
        : undefined,
      ...request.customClaims,
    };
  }
}
