import { Prisma } from "@prisma/client"
import { beforeAll, describe, expect, it, vi } from "vitest"
import { convertKnownErrors } from "../convertKnownErrors"
import { ValidationError } from "~/domain/errors"

describe("clients/prisma/extensions.ts", () => {
  const extension = convertKnownErrors()
  let mockQuery = vi.fn()
  let result: any
  let error: Error

  describe("when pass through successful queries", () => {
    const expectedResult = { id: 1, name: "test" }

    beforeAll(async () => {
      mockQuery.mockResolvedValue(expectedResult)

      result = await extension.query.$allModels.$allOperations({
        args: { where: { id: 1 } },
        query: mockQuery,
      })
    })

    it("returns expected result", () => {
      expect(result).toEqual(expectedResult)
    })
  })

  describe("when pass through unknown errors", () => {
    beforeAll(async () => {
      mockQuery.mockRejectedValue(new Error("Database connection failed"))

      try {
        result = await extension.query.$allModels.$allOperations({
          args: {},
          query: mockQuery,
        })
      } catch (e: unknown) {
        if (e instanceof Error) {
          error = e
        } else {
          error = new Error("Unknown error")
        }
      }
    })

    it("throws expected error", () => {
      expect(error).toStrictEqual(new Error("Database connection failed"))
    })
  })

  describe("when convert P2002 unique constraint error to InvalidPayloadError", () => {
    beforeAll(async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "5.0.0",
        meta: {
          modelName: "Item",
          target: ["foo", "bar"],
        },
      })

      mockQuery.mockRejectedValue(prismaError)

      try {
        result = await extension.query.$allModels.$allOperations({
          args: {},
          query: mockQuery,
        })
      } catch (e: unknown) {
        if (e instanceof Error) {
          error = e
        } else {
          error = new Error("Unknown error")
        }
      }
    })

    it("throws expected error", () => {
      expect(error).toStrictEqual(
        new ValidationError("Item with same foo and bar already exists."),
      )
    })
  })

  describe("when handle P2002 error without modelName", () => {
    beforeAll(async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "5.0.0",
        meta: {
          target: ["foo"],
        },
      })

      mockQuery.mockRejectedValue(prismaError)

      try {
        result = await extension.query.$allModels.$allOperations({
          args: {},
          query: mockQuery,
        })
      } catch (e: unknown) {
        if (e instanceof Error) {
          error = e
        } else {
          error = new Error("Unknown error")
        }
      }
    })

    it("throws expected error", () => {
      expect(error).toStrictEqual(
        new ValidationError("Resource with same foo already exists."),
      )
    })
  })
})
