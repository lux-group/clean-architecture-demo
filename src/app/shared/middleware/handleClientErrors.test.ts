import { beforeEach, describe, expect, test, vi } from "vitest"
import { NextFunction, Request, Response } from "express"
import { Logger } from "~/infrastructure/logging"
import { AuthenticationError, AuthorizationError, ConcurrencyError, InvalidOperationError, NotFoundError, ValidationError } from "~/domain/errors"
import { handleClientErrors } from "./handleClientErrors"

describe("Handle Client Errors Middleware", () => {
  const nextFunction: NextFunction = vi.fn()
  let mockRequest: Request
  let mockResponse: Response
  let mockLogger: Logger
  let handler: (error: Error, req: Request, res: Response, next: NextFunction) => void

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockRequest = {} as Request
    mockResponse = {} as Response
    mockResponse.status = vi.fn().mockReturnValue(mockResponse)
    mockResponse.json = vi.fn().mockReturnValue(mockResponse)
    
    mockLogger = vi.mocked({
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn()
    } satisfies Logger)
    
    handler = handleClientErrors(mockLogger)
  })

  test("AuthenticationError", () => {
    const error = new AuthenticationError("Authentication error")
    const expectedResponse = {
      message: "Authentication error",
      status: 401,
    }

    handler(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status)
    expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse)
    expect(mockLogger.info).toHaveBeenCalledWith(error)
    expect(nextFunction).not.toHaveBeenCalled()
  })

  test("AuthorizationError", () => {
    const error = new AuthorizationError("Authorization error")
    const expectedResponse = {
      message: "Authorization error",
      status: 403,
    }

    handler(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status)
    expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse)
    expect(mockLogger.info).toHaveBeenCalledWith(error)
    expect(nextFunction).not.toHaveBeenCalled()
  })

  test("InvalidOperationError", () => {
    const error = new InvalidOperationError("Invalid operation")
    const expectedResponse = {
      message: "Invalid operation",
      status: 400,
    }

    handler(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status)
    expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse)
    expect(mockLogger.info).toHaveBeenCalledWith(error)
    expect(nextFunction).not.toHaveBeenCalled()
  })

  test("NotFoundError", () => {
    const error = new NotFoundError("Not found error")
    const expectedResponse = {
      message: "Not found error",
      status: 404,
    }

    handler(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status)
    expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse)
    expect(mockLogger.info).toHaveBeenCalledWith(error)
    expect(nextFunction).not.toHaveBeenCalled()
  })

  test("ValidationError", () => {
    const error = new ValidationError("Validation error", [{ path: "field", message: "Invalid value" }])
    const expectedResponse = {
      message: "Validation error",
      status: 400,
      errors: [{ path: "field", message: "Invalid value" }],
    }

    handler(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status)
    expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse)
    expect(mockLogger.info).toHaveBeenCalledWith(error)
    expect(nextFunction).not.toHaveBeenCalled()
  })

  test("ConcurrencyError", () => {
    const error = new ConcurrencyError("Concurrency error")
    const expectedResponse = {
      message: "Concurrency error",
      status: 409,
    }

    handler(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status)
    expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse)
    expect(mockLogger.info).toHaveBeenCalledWith(error)
    expect(nextFunction).not.toHaveBeenCalled()
  })

  test("other errors", () => {
    const error = new Error("test error")

    handler(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).not.toHaveBeenCalled()
    expect(mockResponse.json).not.toHaveBeenCalled()
    expect(mockLogger.info).toHaveBeenCalledWith(error)
    expect(nextFunction).toHaveBeenCalledWith(error)
  })

  test("should handle non-Error objects", () => {
    const error = "String error" as unknown as Error

    handler(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).not.toHaveBeenCalled()
    expect(mockResponse.json).not.toHaveBeenCalled()
    expect(mockLogger.info).toHaveBeenCalledWith(error)
    expect(nextFunction).toHaveBeenCalledWith(error)
  })

  test("should handle null/undefined errors", () => {
    const error = null as unknown as Error

    handler(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).not.toHaveBeenCalled()
    expect(mockResponse.json).not.toHaveBeenCalled()
    expect(mockLogger.info).toHaveBeenCalledWith(error)
    expect(nextFunction).toHaveBeenCalledWith(error)
  })
})

