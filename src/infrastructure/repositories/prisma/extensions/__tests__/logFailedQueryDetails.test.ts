import { Prisma } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { Logger } from "~/infrastructure/logging"
import { logFailedQueryDetails } from "../logFailedQueryDetails"

describe("clients/prisma/extensions.ts", () => {
  const mockQuery = vi.fn()
  let extension: ReturnType<typeof logFailedQueryDetails>
  let mockLogger: Logger
  let result: any
  let error: Error

  beforeEach(() => {
    mockLogger = {
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    } as unknown as Logger
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockQuery.mockReset()
    extension = logFailedQueryDetails(mockLogger)
  })

  describe("when query succeeds", () => {
    const expectedResult = { id: 1, name: "test" }

    beforeEach(async () => {
      mockQuery.mockResolvedValue(expectedResult)

      result = await extension.query.$allModels.$allOperations({
        model: "User",
        operation: "findUnique",
        args: { where: { id: 1 } },
        query: mockQuery,
      })
    })

    it("returns expected result", () => {
      expect(result).toEqual(expectedResult)
    })

    it("does not log any errors", () => {
      expect(mockLogger.error).not.toHaveBeenCalled()
    })
  })

  describe("when query fails with PrismaClientKnownRequestError", () => {
    beforeEach(async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "5.0.0",
        meta: {
          modelName: "User",
          target: ["email"],
        },
        batchRequestIdx: 0,
      })

      mockQuery.mockRejectedValue(prismaError)

      try {
        await extension.query.$allModels.$allOperations({
          model: "User",
          operation: "findUnique",
          args: { data: { email: "test@example.com" } },
          query: mockQuery,
        })
      } catch (e: unknown) {
        if (e instanceof Error) {
          error = e
        }
      }
    })

    it("logs the error with correct details", () => {
      expect(mockLogger.error).toHaveBeenCalledWith("Prisma operation failed.", {
        model: "User",
        operation: "findUnique",
        args: { data: { email: "test@example.com" } },
        meta: {
          modelName: "User",
          target: ["email"],
        },
        error: {
          message: "Unique constraint failed",
          code: "P2002",
        },
      })
    })

    it("re-throws the original error", () => {
      expect(error).toBeInstanceOf(Prisma.PrismaClientKnownRequestError)
      expect(error.message).toBe("Unique constraint failed")
    })
  })

  describe("when query fails with standard Error", () => {
    beforeEach(async () => {
      const standardError = new Error("Database connection failed")
      mockQuery.mockRejectedValue(standardError)

      try {
        await extension.query.$allModels.$allOperations({
          model: "User",
          operation: "findUnique",
          args: { where: { id: 1 } },
          query: mockQuery,
        })
      } catch (e: unknown) {
        if (e instanceof Error) {
          error = e
        }
      }
    })

    it("logs the error with message", () => {
      expect(mockLogger.error).toHaveBeenCalledWith("Prisma operation failed.", {
        model: "User",
        operation: "findUnique",
        args: { where: { id: 1 } },
        error: {
          message: "Database connection failed",
        },
      })
    })

    it("re-throws the original error", () => {
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe("Database connection failed")
    })
  })

  describe("when query fails with string error", () => {
    beforeEach(async () => {
      const stringError = "Unexpected string error"
      mockQuery.mockRejectedValue(stringError)

      try {
        await extension.query.$allModels.$allOperations({
          model: "User",
          operation: "findUnique",
          args: { where: { id: 1 } },
          query: mockQuery,
        })
      } catch (e: unknown) {
        error = e as Error
      }
    })

    it("logs the error with message", () => {
      expect(mockLogger.error).toHaveBeenCalledWith("Prisma operation failed.", {
        model: "User",
        operation: "findUnique",
        args: { where: { id: 1 } },
        error: {
          message: "Unexpected string error",
        },
      })
    })

    it("re-throws the original error", () => {
      expect(error).toBe("Unexpected string error")
    })
  })
})
