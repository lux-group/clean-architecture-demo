import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto"
import { EncryptionProvider } from "."

export class NodeEncryptionProvider implements EncryptionProvider {
  private readonly encryptionKeys: Buffer[]

  constructor(encryptionKeys: string[]) {
    this.encryptionKeys = encryptionKeys.map(hex => {
      const buf = Buffer.from(hex, "hex")
      if (buf.length !== 32)
        throw new Error("Each cookie encryption key entry must be 32 bytes (64 hex chars)")
      return buf
    })
  }

  encrypt(plainText: string): string {
    const key = this.encryptionKeys[0]
    const iv = randomBytes(12)
    const cipher = createCipheriv("aes-256-gcm", key, iv)
    const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()])
    const tag = cipher.getAuthTag()
    return Buffer.concat([iv, tag, encrypted]).toString("base64")
  }

  decrypt(cipherText: string): string {
    let lastError: unknown
    for (const key of this.encryptionKeys) {
      try {
        return this.decryptWithKey(cipherText, key)
      } catch (err) {
        lastError = err
      }
    }
    throw lastError
  }

  private decryptWithKey(cipherText: string, key: Buffer): string {
    const data = Buffer.from(cipherText, "base64")
    const iv = data.subarray(0, 12)
    const tag = data.subarray(12, 28)
    const encrypted = data.subarray(28, data.length)
    const decipher = createDecipheriv("aes-256-gcm", key, iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8")
  }
}
