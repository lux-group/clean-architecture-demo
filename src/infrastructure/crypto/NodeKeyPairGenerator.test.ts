import { createPublicKey, createPrivateKey, sign, verify } from "node:crypto"
import { NodeKeyPairGenerator } from "./NodeKeyPairGenerator"

describe("NodeKeyPairGenerator", () => {
  describe("generateKeyPair", () => {
    let result: { publicKey: string; privateKey: string }

    beforeAll(async () => {
      result = await new NodeKeyPairGenerator().generateKeyPair()
    })

    it("should generate a key pair with public and private keys in PEM format", async () => {
      expect(result).toBeDefined()
      expect(result.publicKey).toBeDefined()
      expect(result.privateKey).toBeDefined()
      expect(typeof result.publicKey).toBe("string")
      expect(typeof result.privateKey).toBe("string")
    })

    it("should generate keys in PEM format", async () => {
      expect(result.publicKey).toMatch(/^-----BEGIN PUBLIC KEY-----/)
      expect(result.publicKey).toMatch(/-----END PUBLIC KEY-----\s*$/)
      expect(result.privateKey).toMatch(/^-----BEGIN PRIVATE KEY-----/)
      expect(result.privateKey).toMatch(/-----END PRIVATE KEY-----\s*$/)
    })

    it("should generate valid RSA keys that can be parsed by Node.js crypto", async () => {
      expect(() => createPublicKey(result.publicKey)).not.toThrow()
      expect(() => createPrivateKey(result.privateKey)).not.toThrow()
    })

    it("should generate RSA keys with 4096-bit modulus length", async () => {
      const publicKey = createPublicKey(result.publicKey)
      const privateKey = createPrivateKey(result.privateKey)

      // Check key details
      expect(publicKey.asymmetricKeyType).toBe("rsa")
      expect(privateKey.asymmetricKeyType).toBe("rsa")
      
      // For RSA keys, we can check the key size by examining the key details
      const publicKeyDetails = publicKey.asymmetricKeyDetails as any
      const privateKeyDetails = privateKey.asymmetricKeyDetails as any
      expect(publicKeyDetails?.modulusLength).toBe(4096)
      expect(privateKeyDetails?.modulusLength).toBe(4096)
    })

    it("should generate keys that form a valid RSA key pair", async () => {
      const publicKey = createPublicKey(result.publicKey)
      const privateKey = createPrivateKey(result.privateKey)

      // Test that the keys are mathematically related by doing a sign/verify operation
      const testData = Buffer.from("test message for signing")
      
      const signature = sign("sha256", testData, privateKey)
      const isValid = verify("sha256", testData, publicKey, signature)

      expect(isValid).toBe(true)
    })
  })
})

