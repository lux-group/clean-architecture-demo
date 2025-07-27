import { NextFunction, Request, Response } from "express"
import { Logger } from "~/infrastructure/logging"
import { handleServerErrors } from "./handleServerErrors"

describe("Handle Server Errors Middleware", () => {
  const nextFunction: NextFunction = jest.fn()
  let mockRequest: Request
  let mockResponse: Response
  let mockLogger: jest.Mocked<Logger>
  let handler: (error: Error, req: Request, res: Response, next: NextFunction) => void

  const expectedResponse = { status: 500, message: "An internal server error occurred." }
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
    
    handler = handleServerErrors(mockLogger)
  })

  test("should handle object errors", () => {
    const error = new Error("test error")

    handler(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status)
    expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse)
    expect(mockLogger.error).toHaveBeenCalledWith(expectedResponse.message, { error })
    expect(nextFunction).not.toHaveBeenCalled()
  })

  test("should handle string errors", () => {
    const error = "String error" as unknown as Error

    handler(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status)
    expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse)
    expect(mockLogger.error).toHaveBeenCalledWith(expectedResponse.message, { error })
    expect(nextFunction).not.toHaveBeenCalled()
  })

  test("should handle null/undefined errors", () => {
    const error = null as unknown as Error

    handler(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status)
    expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse)
    expect(mockLogger.error).toHaveBeenCalledWith(expectedResponse.message, { error: null })
    expect(nextFunction).not.toHaveBeenCalled()
  })
})
