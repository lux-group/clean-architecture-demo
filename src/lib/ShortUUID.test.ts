import { describe, expect, it } from "vitest"
import { shortToUUID, UUIDToShort } from "./ShortUUID"

describe("ShortUUID", () => {
  describe("UUIDToShort", () => {
    it("should convert a standard UUID to a short base64url string", () => {
      const uuid = "550e8400-e29b-41d4-a716-446655440000"
      const result = UUIDToShort(uuid)

      expect(result).toBe("VQ6EAOKbQdSnFkRmVUQAAA")
      expect(typeof result).toBe("string")
      expect(result.length).toBeLessThan(uuid.length)
    })

    it("should produce consistent results for the same UUID", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000"
      const result1 = UUIDToShort(uuid)
      const result2 = UUIDToShort(uuid)

      expect(result1).toBe(result2)
    })

    it("should not contain standard base64 characters (+, /, =)", () => {
      const uuid = "550e8400-e29b-41d4-a716-446655440000"
      const result = UUIDToShort(uuid)

      expect(result).not.toContain("+")
      expect(result).not.toContain("/")
      expect(result).not.toContain("=")
    })
  })

  describe("shortToUUID", () => {
    it("should convert a short base64url string back to a standard UUID", () => {
      const short = "VQ6EAOKbQdSnFkRmVUQAAA"
      const result = shortToUUID(short)

      expect(result).toBe("550e8400-e29b-41d4-a716-446655440000")
    })

    it("should produce consistent results for the same short string", () => {
      const short = "Ej5FZ-ibEtOkVkJmFBdAAA"
      const result1 = shortToUUID(short)
      const result2 = shortToUUID(short)

      expect(result1).toBe(result2)
    })
  })

  describe("Round-trip conversion", () => {
    it("should maintain data integrity when converting UUID to short and back", () => {
      const originalUuid = "550e8400-e29b-41d4-a716-446655440000"
      const short = UUIDToShort(originalUuid)
      const convertedBack = shortToUUID(short)

      expect(convertedBack).toBe(originalUuid)
    })

    it("should maintain data integrity when converting short to UUID and back", () => {
      const originalShort = "VQ6EAOKbQdSnFkRmVUQAAA"
      const uuid = shortToUUID(originalShort)
      const convertedBack = UUIDToShort(uuid)

      expect(convertedBack).toBe(originalShort)
    })
  })
})
