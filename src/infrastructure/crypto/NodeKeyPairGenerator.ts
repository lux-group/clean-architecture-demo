import { generateKeyPair } from 'node:crypto';
import { promisify } from 'node:util';
import { KeyPairGenerator } from '~/application/ports';

const generateKeyPairAsync = promisify(generateKeyPair);

export class NodeKeyPairGenerator implements KeyPairGenerator {
  async generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    const pair = await generateKeyPairAsync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    return {
      publicKey: pair.publicKey,
      privateKey: pair.privateKey,
    };
  }
}
