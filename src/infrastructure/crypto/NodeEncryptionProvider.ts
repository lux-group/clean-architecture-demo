import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { EncryptionProvider } from '~/application/ports';

const IV_LENGTH_BYTES = 12;
const AUTH_TAG_LENGTH_BYTES = 16;

const cipherOptions = { authTagLength: AUTH_TAG_LENGTH_BYTES };

export class NodeEncryptionProvider implements EncryptionProvider {
  private readonly encryptionKeys: Buffer[];

  constructor(encryptionKeys: string[]) {
    this.encryptionKeys = encryptionKeys.map(hex => {
      const buf = Buffer.from(hex, 'hex');
      if (buf.length !== 32) throw new Error('Each cookie encryption key entry must be 32 bytes (64 hex chars)');
      return buf;
    });
  }

  encrypt(plainText: string): string {
    const key = this.encryptionKeys[0];
    const iv = randomBytes(IV_LENGTH_BYTES);
    const cipher = createCipheriv('aes-256-gcm', key, iv, cipherOptions);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  }

  decrypt(cipherText: string): string {
    let lastError: unknown;
    for (const key of this.encryptionKeys) {
      try {
        return this.decryptWithKey(cipherText, key);
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError;
  }

  private decryptWithKey(cipherText: string, key: Buffer): string {
    const data = Buffer.from(cipherText, 'base64');

    if (data.length < IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES) {
      throw new Error('Cipher text is too short to contain IV and auth tag');
    }

    const iv = data.subarray(0, IV_LENGTH_BYTES);
    const tag = data.subarray(IV_LENGTH_BYTES, IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES);
    const encrypted = data.subarray(IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES);
    const decipher = createDecipheriv('aes-256-gcm', key, iv, cipherOptions);
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }
}
