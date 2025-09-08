import { describe, expect, it } from "vitest"
import { mapOrderBy, mapQuery, mapSelect, mapWhere } from "./helpers"

type Sample = {
  id: string
  name: string
  age: number
  active: boolean
  createdAt: Date
}

describe("prisma helpers", () => {
  describe("mapSelect", () => {
    it("returns undefined when no select provided", () => {
      expect(mapSelect<Sample>(undefined)).toBeUndefined()
    })

    it("maps keys to true flags", () => {
      const select = mapSelect<Sample>(["id", "name"])!
      expect(select).toEqual({ id: true, name: true })
    })
  })

  describe("mapOrderBy", () => {
    it("returns undefined when not provided", () => {
      expect(mapOrderBy<Sample>(undefined)).toBeUndefined()
    })

    it("maps property and direction", () => {
      const order = mapOrderBy<Sample>({ property: "createdAt", direction: "desc" })!
      expect(order).toEqual({ createdAt: "desc" })
    })
  })

  describe("mapWhere", () => {
    it("maps equals", () => {
      expect(mapWhere<Sample>({ operator: "equals", property: "id", value: "1" })).toEqual({ id: { equals: "1" } })
    })

    it("maps not-equals", () => {
      expect(mapWhere<Sample>({ operator: "not-equals", property: "active", value: false })).toEqual({ active: { not: false } })
    })

    it("maps in and not-in", () => {
      expect(mapWhere<Sample>({ operator: "in", property: "id", values: ["a", "b"] })).toEqual({ id: { in: ["a", "b"] } })
      expect(mapWhere<Sample>({ operator: "not-in", property: "id", values: ["a", "b"] })).toEqual({ id: { notIn: ["a", "b"] } })
    })

    it("maps contains/starts-with/ends-with", () => {
      expect(mapWhere<Sample>({ operator: "contains", property: "name", value: "a" })).toEqual({ name: { contains: "a" } })
      expect(mapWhere<Sample>({ operator: "starts-with", property: "name", value: "A" })).toEqual({ name: { startsWith: "A" } })
      expect(mapWhere<Sample>({ operator: "ends-with", property: "name", value: "z" })).toEqual({ name: { endsWith: "z" } })
    })

    it("maps greater-than and less-than", () => {
      expect(mapWhere<Sample>({ operator: "greater-than", property: "age", value: 18 })).toEqual({ age: { gt: 18 } })
      expect(mapWhere<Sample>({ operator: "less-than", property: "age", value: 65 })).toEqual({ age: { lt: 65 } })
    })

    it("maps and/or/not recursively", () => {
      const and = mapWhere<Sample>({ operator: "and", filters: [
        { operator: "equals", property: "active", value: true },
        { operator: "contains", property: "name", value: "a" },
      ] })
      expect(and).toEqual({ AND: [
        { active: { equals: true } },
        { name: { contains: "a" } },
      ] })

      const or = mapWhere<Sample>({ operator: "or", filters: [
        { operator: "equals", property: "active", value: true },
        { operator: "equals", property: "active", value: false },
      ] })
      expect(or).toEqual({ OR: [
        { active: { equals: true } },
        { active: { equals: false } },
      ] })

      const not = mapWhere<Sample>({ operator: "not", filter: { operator: "equals", property: "id", value: "1" } })
      expect(not).toEqual({ NOT: { id: { equals: "1" } } })
    })
  })

  describe("mapQuery", () => {
    it("maps basic fields", () => {
      const args = mapQuery<Sample>({
        limit: 10,
        offset: 20,
        orderBy: { property: "createdAt", direction: "asc" },
        where: { operator: "equals", property: "active", value: true },
        select: ["id", "name"],
      })

      expect(args.skip).toBe(20)
      expect(args.take).toBe(10)
      expect(args.orderBy).toEqual({ createdAt: "asc" })
      expect(args.where).toEqual({ active: { equals: true } })
      expect(args.select).toEqual({ id: true, name: true })
    })

    it("merges include into select when select exists", () => {
      const args = mapQuery<Sample>({
        limit: 5,
        offset: 0,
        select: ["id"],
      }, ["name"]) // include name as well

      expect(args.select).toEqual({ id: true, name: true })
      expect(args.include).toBeUndefined()
    })

    it("sets include when select is not provided", () => {
      const args = mapQuery<Sample>({
        limit: 5,
        offset: 0,
      }, ["name", "active"])

      expect(args.select).toBeUndefined()
      expect(args.include).toEqual({ name: true, active: true })
    })
  })
})


