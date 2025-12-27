import { IdentityProvider } from '~/domain/entities';
import { Profile } from './auth';

export const TokenVersion = {
  V1: '1.0',
  V2: '2.0',
} as const;

export type TokenVersion = (typeof TokenVersion)[keyof typeof TokenVersion];

export interface TokenRequest {
  readonly version: TokenVersion;
  readonly userId: string;
  readonly impersonatedByUserId?: string;
  readonly sessionId?: string;
  readonly audience?: string;
  readonly scopes?: string[];
  readonly customClaims: Record<string, unknown>;
}

export interface TokenResponse {
  readonly accessToken: string;
  readonly expiresIn: number;
  readonly claims: Record<string, unknown>;
}

export interface TokenIssuer {
  createAccessToken(request: TokenRequest): Promise<TokenResponse>;
}

export interface TokenValidationResult {
  readonly identityProvider: IdentityProvider;
  readonly profile: Profile;
}

export interface TokenValidator {
  decodeAndValidateToken(token: string): Promise<TokenValidationResult>;
}
