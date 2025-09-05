import { fail } from "node:assert"
import { describe, expect, it } from "vitest"
import { InvalidOperationError } from "~/domain/errors"
import { CreateSigningKeyProps, SigningKey } from "./SigningKey"

describe("SigningKey", () => {
  const mockCreateProps: CreateSigningKeyProps = {
    publicKey: "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----",
    privateKey: "encrypted-private-key-data",
  }

  const mockCreatePropsInactive: CreateSigningKeyProps = {
    publicKey: "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----",
    privateKey: null,
  }

  describe("createNew", () => {
    it("should create a new SigningKey with generated id and timestamps", () => {
      const signingKey = SigningKey.createNew(mockCreateProps)

      expect(signingKey.id).toBeDefined()
      expect(signingKey.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      expect(signingKey.createdAt).toBeInstanceOf(Date)
      expect(signingKey.updatedAt).toBeInstanceOf(Date)
      expect(signingKey.publicKey).toBe(mockCreateProps.publicKey)
      expect(signingKey.privateKey).toBe(mockCreateProps.privateKey)
    })

    it("should create SigningKey with null encrypted private key", () => {
      const signingKey = SigningKey.createNew(mockCreatePropsInactive)

      expect(signingKey.privateKey).toBeNull()
      expect(signingKey.publicKey).toBe(mockCreatePropsInactive.publicKey)
    })

    it.each([
      { path: "publicKey", value: null, error: "expected string" },
      { path: "publicKey", value: "", error: "1 character" },
      { path: "privateKey", value: "", error: "1 character" },
    ])("should throw a validation error when $path is $value", async ({ path, value, error }) => {
      try {
        SigningKey.createNew({ ...mockCreateProps, [path]: value })
        fail("Expected validation error to be thrown")
      } catch (thrownError: any) {
        expect(thrownError.errors).toBeDefined()
        expect(thrownError.errors[0].path).toContain(path)
        expect(thrownError.errors[0].message).toContain(error)
      }
    })
  })

  describe("ensureCanDelete", () => {
    it("should not throw for inactive signing key (null encrypted private key)", () => {
      const signingKey = SigningKey.createNew(mockCreatePropsInactive)

      expect(() => {
        signingKey.ensureCanDelete()
      }).not.toThrow()
    })

    it("should throw InvalidOperationError for active signing key", () => {
      const signingKey = SigningKey.createNew(mockCreateProps)

      expect(() => {
        signingKey.ensureCanDelete()
      }).toThrow(InvalidOperationError)

      expect(() => {
        signingKey.ensureCanDelete()
      }).toThrow("The signing key cannot be deleted while it is active.")
    })
  })

  describe("deactivate", () => {
    it("should deactivate an active signing key", () => {
      const signingKey = SigningKey.createNew(mockCreateProps)
      const originalUpdatedAt = signingKey.updatedAt

      signingKey.deactivate()

      expect(signingKey.privateKey).toBeNull()
      expect(signingKey.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime())
      expect(signingKey.publicKey).toBe(mockCreateProps.publicKey) // Should remain unchanged
    })

    it("should throw InvalidOperationError when trying to deactivate already inactive key", () => {
      const signingKey = SigningKey.createNew(mockCreatePropsInactive)

      expect(() => {
        signingKey.deactivate()
      }).toThrow(InvalidOperationError)

      expect(() => {
        signingKey.deactivate()
      }).toThrow("The signing key cannot be deactivated because it is already inactive.")
    })

    it("should throw InvalidOperationError when trying to deactivate already deactivated key", () => {
      const signingKey = SigningKey.createNew(mockCreateProps)

      signingKey.deactivate() // First deactivation

      expect(() => {
        signingKey.deactivate() // Second deactivation attempt
      }).toThrow(InvalidOperationError)

      expect(() => {
        signingKey.deactivate()
      }).toThrow("The signing key cannot be deactivated because it is already inactive.")
    })
  })

  describe("workflow scenarios", () => {
    it("should handle complete lifecycle: create active -> deactivate -> ensure can delete", () => {
      // Create active signing key
      const signingKey = SigningKey.createNew(mockCreateProps)
      expect(signingKey.privateKey).not.toBeNull()

      // Should not be able to delete while active
      expect(() => {
        signingKey.ensureCanDelete()
      }).toThrow(InvalidOperationError)

      // Deactivate the key
      signingKey.deactivate()
      expect(signingKey.privateKey).toBeNull()

      // Should now be able to delete
      expect(() => {
        signingKey.ensureCanDelete()
      }).not.toThrow()
    })

    it("should handle inactive key creation and deletion", () => {
      // Create inactive signing key
      const signingKey = SigningKey.createNew(mockCreatePropsInactive)
      expect(signingKey.privateKey).toBeNull()

      // Should be able to delete immediately
      expect(() => {
        signingKey.ensureCanDelete()
      }).not.toThrow()

      // Should not be able to deactivate (already inactive)
      expect(() => {
        signingKey.deactivate()
      }).toThrow(InvalidOperationError)
    })
  })

  describe("property immutability", () => {
    it("should not modify id, createdAt, or publicKey during deactivation", () => {
      const signingKey = SigningKey.createNew(mockCreateProps)
      const originalId = signingKey.id
      const originalCreatedAt = signingKey.createdAt
      const originalPublicKey = signingKey.publicKey

      signingKey.deactivate()

      expect(signingKey.id).toBe(originalId)
      expect(signingKey.createdAt).toBe(originalCreatedAt)
      expect(signingKey.publicKey).toBe(originalPublicKey)
    })
  })
})
