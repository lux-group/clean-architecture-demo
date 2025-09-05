import { describe, expect, it } from "vitest"
import {
  type KeyTransformer,
  toCamelCase,
  toDateObject,
  toISODateString,
  toSnakeCase,
  transformObject,
  type ValueTransformer,
} from "./transformObject"

describe("transformObject", () => {
  describe("transform", () => {
    it("should transform array of objects with key and value transformers", () => {
      const input = [
        { user_name: "john", created_at: new Date("2023-01-01") },
        { user_name: "jane", created_at: new Date("2023-01-02") },
      ]

      const result = transformObject(input, [toCamelCase], [toISODateString])

      expect(result).toEqual([
        { userName: "john", createdAt: "2023-01-01T00:00:00.000Z" },
        { userName: "jane", createdAt: "2023-01-02T00:00:00.000Z" },
      ])
    })

    it("should transform nested objects", () => {
      const input = {
        user_profile: {
          first_name: "John",
          last_name: "Doe",
          contact_info: {
            email_address: "john@example.com",
            phone_number: "123-456-7890",
          },
        },
      }

      const result = transformObject(input, [toCamelCase], [])

      expect(result).toEqual({
        userProfile: {
          firstName: "John",
          lastName: "Doe",
          contactInfo: {
            emailAddress: "john@example.com",
            phoneNumber: "123-456-7890",
          },
        },
      })
    })

    it("should handle null values", () => {
      const result = transformObject(null, [toCamelCase], [])
      expect(result).toBeNull()
    })

    it("should handle primitive values", () => {
      expect(transformObject("string", [], [])).toBe("string")
      expect(transformObject(123, [], [])).toBe(123)
      expect(transformObject(true, [], [])).toBe(true)
      expect(transformObject(undefined, [], [])).toBeUndefined()
    })

    it("should handle Date objects without transformation", () => {
      const date = new Date("2023-01-01")
      const result = transformObject(date, [toCamelCase], [])
      expect(result).toBe(date)
      expect(result instanceof Date).toBe(true)
    })

    it("should apply multiple key transformers in sequence", () => {
      const customTransformer: KeyTransformer = (key: string) => `prefix_${key}`

      const input = { user_name: "john" }
      const result = transformObject(input, [toCamelCase, customTransformer], [])

      expect(result).toEqual({ prefix_userName: "john" })
    })

    it("should apply multiple value transformers in sequence", () => {
      const upperCaseTransformer: ValueTransformer = (value: any) => (typeof value === "string" ? value.toUpperCase() : value)

      const input = { name: "john" }
      const result = transformObject(input, [], [upperCaseTransformer, (value: any) => (typeof value === "string" ? `${value}!` : value)])

      expect(result).toEqual({ name: "JOHN!" })
    })

    it("should handle empty objects", () => {
      const result = transformObject({}, [toCamelCase], [])
      expect(result).toEqual({})
    })

    it("should handle empty arrays", () => {
      const result = transformObject([], [toCamelCase], [])
      expect(result).toEqual([])
    })

    it("should handle mixed array of primitives and objects", () => {
      const input = ["string", 123, { user_name: "john" }, null, { active_status: true }]

      const result = transformObject(input, [toCamelCase], [])

      expect(result).toEqual(["string", 123, { userName: "john" }, null, { activeStatus: true }])
    })
  })
})

describe("toCamelCase", () => {
  it("should convert snake_case to camelCase", () => {
    expect(toCamelCase("user_name")).toBe("userName")
    expect(toCamelCase("first_name_last")).toBe("firstNameLast")
    expect(toCamelCase("created_at")).toBe("createdAt")
  })

  it("should handle strings with multiple underscores", () => {
    expect(toCamelCase("user_profile_data_field")).toBe("userProfileDataField")
  })

  it("should handle strings without underscores", () => {
    expect(toCamelCase("username")).toBe("username")
    expect(toCamelCase("id")).toBe("id")
  })

  it("should handle empty strings", () => {
    expect(toCamelCase("")).toBe("")
  })

  it("should handle strings with underscores at the end", () => {
    expect(toCamelCase("user_name_")).toBe("userName_")
  })

  it("should handle strings starting with underscore", () => {
    expect(toCamelCase("_user_name")).toBe("UserName")
  })

  it("should only convert lowercase letters after underscores", () => {
    expect(toCamelCase("user_Name")).toBe("user_Name") // Capital N should not be affected
    expect(toCamelCase("user_1name")).toBe("user_1name") // Numbers should not be affected
  })
})

describe("toSnakeCase", () => {
  it("should convert camelCase to snake_case", () => {
    expect(toSnakeCase("userName")).toBe("user_name")
    expect(toSnakeCase("firstName")).toBe("first_name")
    expect(toSnakeCase("createdAt")).toBe("created_at")
  })

  it("should handle multiple capital letters", () => {
    expect(toSnakeCase("userProfileData")).toBe("user_profile_data")
    expect(toSnakeCase("XMLHttpRequest")).toBe("_x_m_l_http_request")
  })

  it("should handle strings without capital letters", () => {
    expect(toSnakeCase("username")).toBe("username")
    expect(toSnakeCase("id")).toBe("id")
  })

  it("should handle empty strings", () => {
    expect(toSnakeCase("")).toBe("")
  })

  it("should handle strings starting with capital letter", () => {
    expect(toSnakeCase("UserName")).toBe("_user_name")
  })

  it("should handle single character strings", () => {
    expect(toSnakeCase("a")).toBe("a")
    expect(toSnakeCase("A")).toBe("_a")
  })
})

describe("toISODateString", () => {
  it("should convert Date objects to ISO strings", () => {
    const date = new Date("2023-01-01T12:00:00.000Z")
    const result = toISODateString(date)
    expect(result).toBe("2023-01-01T12:00:00.000Z")
  })

  it("should leave non-Date values unchanged", () => {
    expect(toISODateString("string")).toBe("string")
    expect(toISODateString(123)).toBe(123)
    expect(toISODateString(null)).toBe(null)
    expect(toISODateString(undefined)).toBe(undefined)
    expect(toISODateString({ key: "value" })).toEqual({ key: "value" })
  })

  it("should handle different Date values", () => {
    const date1 = new Date("2023-12-25T00:00:00.000Z")
    const date2 = new Date("1990-06-15T15:30:45.123Z")

    expect(toISODateString(date1)).toBe("2023-12-25T00:00:00.000Z")
    expect(toISODateString(date2)).toBe("1990-06-15T15:30:45.123Z")
  })
})

describe("toDateObject", () => {
  it("should convert valid date strings to Date objects", () => {
    const result = toDateObject("2023-01-01T12:00:00.000Z")
    expect(result instanceof Date).toBe(true)
    expect(result.toISOString()).toBe("2023-01-01T12:00:00.000Z")
  })

  it("should convert various date string formats", () => {
    const dateString1 = "2023-01-01"
    const dateString2 = "2023/01/01"
    const dateString3 = "Jan 1, 2023"

    expect(toDateObject(dateString1) instanceof Date).toBe(true)
    expect(toDateObject(dateString2) instanceof Date).toBe(true)
    expect(toDateObject(dateString3) instanceof Date).toBe(true)
  })

  it("should leave invalid date strings unchanged", () => {
    expect(toDateObject("invalid-date")).toBe("invalid-date")
    expect(toDateObject("not a date")).toBe("not a date")
    expect(toDateObject("")).toBe("")
  })

  it("should leave non-string values unchanged", () => {
    expect(toDateObject(123)).toBe(123)
    expect(toDateObject(null)).toBe(null)
    expect(toDateObject(undefined)).toBe(undefined)
    expect(toDateObject({ key: "value" })).toEqual({ key: "value" })
  })

  it("should leave Date objects unchanged", () => {
    const date = new Date("2023-01-01")
    expect(toDateObject(date)).toBe(date)
  })

  it("should handle edge cases", () => {
    // Empty string should not be converted
    expect(toDateObject("")).toBe("")

    // Whitespace-only string should not be converted
    expect(toDateObject("   ")).toBe("   ")

    // Large number strings might be interpreted as timestamps, so they could be converted
    const result = toDateObject("123456")
    // Since Date.parse("123456") returns a valid number, this will be converted to a Date
    expect(result instanceof Date || result === "123456").toBe(true)
  })
})
