import { NextFunction, Request, Response } from "express"
import { Logger } from "~/infrastructure/logging"
import { AuthenticationError, AuthorizationError, InvalidOperationError } from "~/domain/errors"
import { handleOAuthErrors } from "./handleOAuthErrors"

describe("Handle OAuth Errors Middleware", () => {
  const nextFunction: NextFunction = jest.fn()
  let mockRequest: Request
  let mockResponse: Response
  let mockLogger: jest.Mocked<Logger>
  let handler: (error: Error, req: Request, res: Response, next: NextFunction) => void

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockRequest = {} as Request
    mockResponse = {} as Response
    mockResponse.status = jest.fn().mockReturnValue(mockResponse)
    mockResponse.json = jest.fn().mockReturnValue(mockResponse)
    
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn()
    }
    
    handler = handleOAuthErrors(mockLogger)
  })

  test("AuthenticationError", () => {
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

  test("AuthorizationError", () => {
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

  test("InvalidOperationError", () => {
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
