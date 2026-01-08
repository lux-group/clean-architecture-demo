import { randomUUID } from 'node:crypto';
import { InvalidOperationError } from '../errors';

export type SigningKey = Readonly<{
  id: string;
  createdAt: Date;
  updatedAt: Date;
  publicKey: string;
  privateKey: string | null;
}>;

export type CreateSigningKeyProps = Omit<SigningKey, 'id' | 'createdAt' | 'updatedAt'>;

export const SigningKey = {
  createNew(props: CreateSigningKeyProps, now: Date = new Date()): SigningKey {
    return {
      ...props,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
  },

  ensureCanDelete(signingKey: SigningKey): void {
    if (signingKey.privateKey != null) {
      throw new InvalidOperationError('The signing key cannot be deleted while it is active.');
    }
  },

  deactivate(signingKey: SigningKey, now: Date = new Date()): SigningKey {
    if (signingKey.privateKey == null) {
      throw new InvalidOperationError('The signing key cannot be deactivated because it is already inactive.');
    }

    return {
      ...signingKey,
      privateKey: null,
      updatedAt: now,
    };
  },
} as const;
