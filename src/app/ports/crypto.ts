export interface PasswordVerifier {
  verifyPassword(plainText: string, storedHash: string): boolean
  createPasswordHash(plainText: string): string
}

export interface EncryptionProvider {
  encrypt(plainText: string): string
  decrypt(cipherText: string): string
}

export interface KeyPairGenerator {
  generateKeyPair(): Promise<{ publicKey: string; privateKey: string }>
}
