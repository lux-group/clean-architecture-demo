import { BCryptPasswordVerifier } from "./BCryptPasswordVerifier"

describe("BCryptPasswordVerifier", () => {
  let provider: BCryptPasswordVerifier

  beforeEach(() => {
    provider = new BCryptPasswordVerifier()
  })

  describe("createHash", () => {
    it("should hash a secret", () => {
      const secret = "mySecret123"
      const hash = provider.createPasswordHash(secret)

      expect(hash).toBeDefined()
      expect(hash).not.toBe(secret)
      expect(hash.length).toBeGreaterThan(0)
    })

    it("should generate different hashes for the same secret", () => {
      const secret = "mySecret123"
      const hash1 = provider.createPasswordHash(secret)
      const hash2 = provider.createPasswordHash(secret)

      expect(hash1).not.toBe(hash2)
    })

    it("should handle empty string", () => {
      const hash = provider.createPasswordHash("")
      
      expect(hash).toBeDefined()
      expect(hash.length).toBeGreaterThan(0)
    })
  })

  describe("verify", () => {
    it("should return true for matching secret and hash", () => {
      const secret = "mySecret123"
      const hash = provider.createPasswordHash(secret)

      const result = provider.verifyPassword(secret, hash)

      expect(result).toBe(true)
    })

    it("should return false for non-matching secret and hash", () => {
      const secret = "mySecret123"
      const wrongSecret = "wrongSecret"
      const hash = provider.createPasswordHash(secret)

      const result = provider.verifyPassword(wrongSecret, hash)

      expect(result).toBe(false)
    })

    it("should return false for empty secret against valid hash", () => {
      const secret = "mySecret123"
      const hash = provider.createPasswordHash(secret)

      const result = provider.verifyPassword("", hash)

      expect(result).toBe(false)
    })

    it("should handle empty secret hash correctly", () => {
      const emptySecret = ""
      const hash = provider.createPasswordHash(emptySecret)

      const result = provider.verifyPassword(emptySecret, hash)

      expect(result).toBe(true)
    })
  })
})

