export interface PasswordVerifier {
  verifyPassword(plainText: string, storedHash: string): boolean
  createPasswordHash(plainText: string): string
}
