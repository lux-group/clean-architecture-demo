import { beforeEach, describe, expect, it } from "vitest"
import { NodeEncryptionProvider } from "./NodeEncryptionProvider"

describe("NodeEncryptionProvider", () => {
  const validKey = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef" // 64 hex chars = 32 bytes
  const anotherValidKey = "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210"

  describe("constructor", () => {
    it("should create provider with valid encryption key", () => {
      expect(() => new NodeEncryptionProvider([validKey])).not.toThrow()
    })

    it("should create provider with multiple valid encryption keys", () => {
      expect(() => new NodeEncryptionProvider([validKey, anotherValidKey])).not.toThrow()
    })

    it("should throw error for invalid key length", () => {
      const shortKey = "0123456789abcdef" // 16 hex chars = 8 bytes (too short)

      expect(() => new NodeEncryptionProvider([shortKey])).toThrow(
        "Each cookie encryption key entry must be 32 bytes (64 hex chars)",
      )
    })

    it("should throw error for non-hex characters", () => {
      const invalidKey = "g123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef" // 'g' is not hex

      expect(() => new NodeEncryptionProvider([invalidKey])).toThrow()
    })
  })

  describe("encrypt and decrypt", () => {
    let provider: NodeEncryptionProvider

    beforeEach(() => {
      provider = new NodeEncryptionProvider([validKey])
    })

    it("should encrypt and decrypt a simple string", () => {
      const plainText = "Hello, World!"

      const encrypted = provider.encrypt(plainText)
      const decrypted = provider.decrypt(encrypted)

      expect(encrypted).toBeDefined()
      expect(encrypted).not.toBe(plainText)
      expect(decrypted).toBe(plainText)
    })

    it("should encrypt and decrypt an empty string", () => {
      const plainText = ""

      const encrypted = provider.encrypt(plainText)
      const decrypted = provider.decrypt(encrypted)

      expect(decrypted).toBe(plainText)
    })

    it("should encrypt and decrypt unicode characters", () => {
      const plainText = "こんにちは 🌍 éñüïöü"

      const encrypted = provider.encrypt(plainText)
      const decrypted = provider.decrypt(encrypted)

      expect(decrypted).toBe(plainText)
    })

    it("should generate different cipher text for same plaintext", () => {
      const plainText = "Hello, World!"

      const encrypted1 = provider.encrypt(plainText)
      const encrypted2 = provider.encrypt(plainText)

      expect(encrypted1).not.toBe(encrypted2)
      expect(provider.decrypt(encrypted1)).toBe(plainText)
      expect(provider.decrypt(encrypted2)).toBe(plainText)
    })

    it("should encrypt and decrypt long text", () => {
      const plainText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(100)

      const encrypted = provider.encrypt(plainText)
      const decrypted = provider.decrypt(encrypted)

      expect(decrypted).toBe(plainText)
    })
  })

  describe("multiple keys support", () => {
    it("should decrypt with any of the provided keys", () => {
      const provider1 = new NodeEncryptionProvider([validKey])
      const provider2 = new NodeEncryptionProvider([anotherValidKey, validKey])
      const plainText = "Hello, World!"

      // Encrypt with first provider (using validKey)
      const encrypted = provider1.encrypt(plainText)

      // Decrypt with second provider (should try anotherValidKey first, then validKey)
      const decrypted = provider2.decrypt(encrypted)

      expect(decrypted).toBe(plainText)
    })

    it("should use first key for encryption", () => {
      const provider = new NodeEncryptionProvider([validKey, anotherValidKey])
      const plainText = "Hello, World!"

      const encrypted = provider.encrypt(plainText)

      // Should be able to decrypt with a provider that only has the first key
      const singleKeyProvider = new NodeEncryptionProvider([validKey])
      const decrypted = singleKeyProvider.decrypt(encrypted)

      expect(decrypted).toBe(plainText)
    })

    it("should throw error when no key can decrypt", () => {
      const provider1 = new NodeEncryptionProvider([validKey])
      const provider2 = new NodeEncryptionProvider([anotherValidKey])
      const plainText = "Hello, World!"

      const encrypted = provider1.encrypt(plainText)

      expect(() => provider2.decrypt(encrypted)).toThrow()
    })
  })

  describe("error handling", () => {
    let provider: NodeEncryptionProvider

    beforeEach(() => {
      provider = new NodeEncryptionProvider([validKey])
    })

    it("should throw error for invalid base64 cipher text", () => {
      expect(() => provider.decrypt("invalid-base64!")).toThrow()
    })

    it("should throw error for corrupted cipher text", () => {
      const validEncrypted = provider.encrypt("test")
      const corrupted = `${validEncrypted.slice(0, -5)}XXXXX`

      expect(() => provider.decrypt(corrupted)).toThrow()
    })

    it("should throw error for too short cipher text", () => {
      expect(() => provider.decrypt("dGVzdA==")).toThrow() // "test" in base64, too short
    })
  })
})
