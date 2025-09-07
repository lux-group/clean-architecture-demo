import { Prisma } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { Logger } from "~/app/ports"
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

  describe("when query fails with PrismaClientInitializationError", () => {
    beforeEach(async () => {
      const prismaError = new Prisma.PrismaClientInitializationError("Initialization failed", "5.0.0", "TestErrorCode")

      mockQuery.mockRejectedValue(prismaError)

      try {
        await extension.query.$allModels.$allOperations({
          model: "User",
          operation: "create",
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
      expect(mockLogger.warn).toHaveBeenCalledWith("Prisma operation failed.", {
        model: "User",
        operation: "create",
        args: { data: { email: "test@example.com" } },
        clientVersion: "5.0.0",
        error: {
          message: "Initialization failed",
          code: "TestErrorCode",
        },
      })
    })

    it("re-throws the original error", () => {
      expect(error).toBeInstanceOf(Prisma.PrismaClientInitializationError)
      expect(error.message).toBe("Initialization failed")
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
          operation: "create",
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
      expect(mockLogger.warn).toHaveBeenCalledWith("Prisma operation failed.", {
        model: "User",
        operation: "create",
        args: { data: { email: "test@example.com" } },
        clientVersion: "5.0.0",
        meta: {
          modelName: "User",
          target: ["email"],
        },
        error: {
          message: "Unique constraint failed",
          code: "P2002",
          batchRequestIdx: 0,
        },
      })
    })

    it("re-throws the original error", () => {
      expect(error).toBeInstanceOf(Prisma.PrismaClientKnownRequestError)
      expect(error.message).toBe("Unique constraint failed")
    })
  })

  describe("when query fails with PrismaClientValidationError", () => {
    beforeEach(async () => {
      const prismaError = new Prisma.PrismaClientValidationError("Validation failed", {
        clientVersion: "5.0.0",
      })

      mockQuery.mockRejectedValue(prismaError)

      try {
        await extension.query.$allModels.$allOperations({
          model: "User",
          operation: "create",
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
      expect(mockLogger.warn).toHaveBeenCalledWith("Prisma operation failed.", {
        model: "User",
        operation: "create",
        args: { data: { email: "test@example.com" } },
        clientVersion: "5.0.0",
        error: {
          message: "Validation failed",
        },
      })
    })

    it("re-throws the original error", () => {
      expect(error).toBeInstanceOf(Prisma.PrismaClientValidationError)
      expect(error.message).toBe("Validation failed")
    })
  })

  describe("when query fails with PrismaClientUnknownRequestError", () => {
    beforeEach(async () => {
      const prismaError = new Prisma.PrismaClientUnknownRequestError("Request failed", {
        clientVersion: "5.0.0",
        batchRequestIdx: 1,
      })

      mockQuery.mockRejectedValue(prismaError)

      try {
        await extension.query.$allModels.$allOperations({
          model: "User",
          operation: "create",
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
      expect(mockLogger.warn).toHaveBeenCalledWith("Prisma operation failed.", {
        model: "User",
        operation: "create",
        args: { data: { email: "test@example.com" } },
        clientVersion: "5.0.0",
        error: {
          message: "Request failed",
          batchRequestIdx: 1,
        },
      })
    })

    it("re-throws the original error", () => {
      expect(error).toBeInstanceOf(Prisma.PrismaClientUnknownRequestError)
      expect(error.message).toBe("Request failed")
    })
  })

  describe("when query fails with other error", () => {
    beforeEach(async () => {
      const objectError = { error: "Unexpected error object" }
      mockQuery.mockRejectedValue(objectError)

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

    it("does not log the error", () => {
      expect(mockLogger.warn).not.toHaveBeenCalled()
    })

    it("re-throws the original error", () => {
      expect(error).toMatchObject({ error: "Unexpected error object" })
    })
  })
})
