import { randomUUID } from 'node:crypto';
import { InvalidOperationError } from '../errors';

export const IdentityProviderType = {
  Entra: 'ENTRA',
  Google: 'GOOGLE',
  Apple: 'APPLE',
  Facebook: 'FACEBOOK',
} as const;

export type IdentityProviderType = (typeof IdentityProviderType)[keyof typeof IdentityProviderType];

export type IdentityProviderAuthSettings = Readonly<{
  type: IdentityProviderType;
  brand: string;
  clientId: string;
  clientSecret: string;
  redirectUrls: string[];
  autoLinkUsers: boolean;
  autoCreateUsers: boolean;
  sessionLifetimeHours: number;
}>;

export type IdentityProvider = Readonly<{
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  issuerUrl: string;
  audience: string;
  identifierClaimName: string;
  authSettings: IdentityProviderAuthSettings | null;
}>;

export type CreateIdentityProviderProps = Omit<IdentityProvider, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateIdentityProviderProps = Omit<IdentityProvider, 'id' | 'createdAt' | 'updatedAt'>;

export const IdentityProvider = {
  createNew(props: CreateIdentityProviderProps, now: Date = new Date()): IdentityProvider {
    return {
      ...props,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
  },

  update(
    identityProvider: IdentityProvider,
    props: UpdateIdentityProviderProps,
    now: Date = new Date(),
  ): IdentityProvider {
    return {
      ...identityProvider,
      ...props,
      updatedAt: now,
    };
  },

  ensureAuthSettings(identityProvider: IdentityProvider): IdentityProviderAuthSettings {
    if (!identityProvider.authSettings) {
      throw InvalidOperationError.identityProviderHasNoAuthSettings(identityProvider.id);
    }

    return identityProvider.authSettings;
  },

  verifyRedirectUrl(identityProvider: IdentityProvider, redirectUrl: string): void {
    const authSettings = IdentityProvider.ensureAuthSettings(identityProvider);

    if (!authSettings.redirectUrls.some(url => redirectUrl.startsWith(url))) {
      throw InvalidOperationError.invalidRedirectUrl(identityProvider.id, redirectUrl);
    }
  },
} as const;
