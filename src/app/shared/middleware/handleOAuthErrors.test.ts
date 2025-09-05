import { mockLogger } from "@test/mocks"
import { NextFunction, Request, Response } from "express"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AuthenticationError, AuthorizationError, InvalidOperationError } from "~/domain/errors"
import { handleOAuthErrors } from "./handleOAuthErrors"

describe("Handle OAuth Errors Middleware", () => {
  const nextFunction: NextFunction = vi.fn()
  let mockRequest: Request
  let mockResponse: Response
  let handler: (error: Error, req: Request, res: Response, next: NextFunction) => void

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {} as Request
    mockResponse = {} as Response
    mockResponse.status = vi.fn().mockReturnValue(mockResponse)
    mockResponse.json = vi.fn().mockReturnValue(mockResponse)

    handler = handleOAuthErrors(mockLogger)()
  })

  it("should handle AuthenticationError", () => {
    const error = new AuthenticationError("Authentication error")
    const expectedResponse = {
      error: "unauthorized_client",
      error_description: "Authentication error",
    }

    handler(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse)
    expect(mockLogger.info).toHaveBeenCalledWith(error)
    expect(nextFunction).not.toHaveBeenCalled()
  })

  it("should handle AuthorizationError", () => {
    const error = new AuthorizationError("Authorization error")
    const expectedResponse = {
      error: "access_denied",
      error_description: "Authorization error",
    }

    handler(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(403)
    expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse)
    expect(mockLogger.info).toHaveBeenCalledWith(error)
    expect(nextFunction).not.toHaveBeenCalled()
  })

  it("should handle InvalidOperationError", () => {
    const error = new InvalidOperationError("Invalid operation")
    const expectedResponse = {
      error: "invalid_request",
      error_description: "Invalid operation",
    }

    handler(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse)
    expect(mockLogger.info).toHaveBeenCalledWith(error)
    expect(nextFunction).not.toHaveBeenCalled()
  })

  it("should handle other errors", () => {
    const error = new Error("test error")

    handler(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).not.toHaveBeenCalled()
    expect(mockResponse.json).not.toHaveBeenCalled()
    expect(mockLogger.info).toHaveBeenCalledWith(error)
    expect(nextFunction).toHaveBeenCalledWith(error)
  })

  it("should handle non-Error objects", () => {
    const error = "String error" as unknown as Error

    handler(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).not.toHaveBeenCalled()
    expect(mockResponse.json).not.toHaveBeenCalled()
    expect(mockLogger.info).toHaveBeenCalledWith(error)
    expect(nextFunction).toHaveBeenCalledWith(error)
  })

  it("should handle null/undefined errors", () => {
    const error = null as unknown as Error

    handler(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).not.toHaveBeenCalled()
    expect(mockResponse.json).not.toHaveBeenCalled()
    expect(mockLogger.info).toHaveBeenCalledWith(error)
    expect(nextFunction).toHaveBeenCalledWith(error)
  })
})
