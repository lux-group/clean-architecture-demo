import { describe, expect, it } from "vitest"
import { parseQuery } from "./parseQuery"
import { InvalidOperationError } from "~/domain/errors"

interface TestEntity {
  id: string
  firstName: string
  lastName: string
  emailAddress: string
  createdAt: Date
}

describe("parseQuery", () => {
  const supportedOrderBy: (keyof TestEntity)[] = ["firstName", "lastName", "createdAt"]
  const supportedWhere: (keyof TestEntity)[] = ["firstName", "emailAddress"]

  describe("offset and limit", () => {
    it("should use default values when not provided", () => {
      const result = parseQuery<TestEntity>({}, supportedOrderBy)

      expect(result.offset).toBe(0)
      expect(result.limit).toBe(50)
    })

    it("should parse custom offset and limit", () => {
      const result = parseQuery<TestEntity>({ offset: "10", limit: "25" }, supportedOrderBy)

      expect(result.offset).toBe(10)
      expect(result.limit).toBe(25)
    })

    it("should handle invalid offset and limit values", () => {
      const result = parseQuery<TestEntity>({ offset: "invalid", limit: "invalid" }, supportedOrderBy)

      expect(result.offset).toBe(0)
      expect(result.limit).toBe(50)
    })
  })

  describe("orderBy", () => {
    it("should parse valid order by field with asc direction", () => {
      const result = parseQuery<TestEntity>({ order_by: "first_name", order_direction: "asc" }, supportedOrderBy)

      expect(result.orderBy).toEqual({
        property: "firstName",
        direction: "asc",
      })
    })

    it("should parse valid order by field with desc direction", () => {
      const result = parseQuery<TestEntity>({ order_by: "created_at", order_direction: "desc" }, supportedOrderBy)

      expect(result.orderBy).toEqual({
        property: "createdAt",
        direction: "desc",
      })
    })

    it("should default to asc when direction is not specified", () => {
      const result = parseQuery<TestEntity>({ order_by: "last_name" }, supportedOrderBy)

      expect(result.orderBy).toEqual({
        property: "lastName",
        direction: "asc",
      })
    })

    it("should throw error for unsupported order by field", () => {
      expect(() => parseQuery<TestEntity>({ order_by: "email_address" }, supportedOrderBy)).toThrow(InvalidOperationError)
    })
  })

  describe("select", () => {
    it("should parse single field selection", () => {
      const result = parseQuery<TestEntity>({ select: "first_name" }, supportedOrderBy)

      expect(result.select).toEqual(["firstName"])
    })

    it("should parse multiple field selection", () => {
      const result = parseQuery<TestEntity>({ select: "first_name,last_name,email_address" }, supportedOrderBy)

      expect(result.select).toEqual(["firstName", "lastName", "emailAddress"])
    })
  })

  describe("where filters", () => {
    it("should create single filter", () => {
      const result = parseQuery<TestEntity>({ first_name: "John" }, supportedOrderBy, supportedWhere)

      expect(result.where).toEqual({
        operator: "equals",
        property: "firstName",
        value: "John",
      })
    })

    it("should create multiple filters with AND operator", () => {
      const result = parseQuery<TestEntity>({ first_name: "John", email_address: "john@example.com" }, supportedOrderBy, supportedWhere)

      expect(result.where).toEqual({
        operator: "and",
        filters: [
          { operator: "equals", property: "firstName", value: "John" },
          { operator: "equals", property: "emailAddress", value: "john@example.com" },
        ],
      })
    })

    it("should ignore unsupported filter fields", () => {
      const result = parseQuery<TestEntity>({ last_name: "Doe" }, supportedOrderBy, supportedWhere)

      expect(result.where).toBeUndefined()
    })

    it("should ignore undefined filter values", () => {
      const result = parseQuery<TestEntity>({ first_name: undefined }, supportedOrderBy, supportedWhere)

      expect(result.where).toBeUndefined()
    })

    describe("wildcard filters", () => {
      it("should create contains filter for value with wildcards on both ends", () => {
        const result = parseQuery<TestEntity>({ first_name: "*oh*" }, supportedOrderBy, supportedWhere)

        expect(result.where).toEqual({
          operator: "contains",
          property: "firstName",
          value: "oh",
        })
      })

      it("should create starts_with filter for value with wildcard at end", () => {
        const result = parseQuery<TestEntity>({ first_name: "Jo*" }, supportedOrderBy, supportedWhere)

        expect(result.where).toEqual({
          operator: "starts-with",
          property: "firstName",
          value: "Jo",
        })
      })

      it("should create ends_with filter for value with wildcard at start", () => {
        const result = parseQuery<TestEntity>({ first_name: "*hn" }, supportedOrderBy, supportedWhere)

        expect(result.where).toEqual({
          operator: "ends-with",
          property: "firstName",
          value: "hn",
        })
      })

      it("should handle multiple wildcard filters", () => {
        const result = parseQuery<TestEntity>(
          {
            first_name: "Jo*",
            email_address: "*@example.com",
          },
          supportedOrderBy,
          supportedWhere,
        )

        expect(result.where).toEqual({
          operator: "and",
          filters: [
            { operator: "starts-with", property: "firstName", value: "Jo" },
            { operator: "ends-with", property: "emailAddress", value: "@example.com" },
          ],
        })
      })
    })
  })
})
