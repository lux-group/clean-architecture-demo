import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextFunction, Request, Response } from "express"
import { mockLogger } from "@test/mocks"
import { handleServerErrors } from "./handleServerErrors"

describe("Handle Server Errors Middleware", () => {
  const nextFunction: NextFunction = vi.fn()
  let mockRequest: Request
  let mockResponse: Response
  let handler: (error: Error, req: Request, res: Response, next: NextFunction) => void

  const expectedResponse = { status: 500, message: "An internal server error occurred." }
  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {} as Request
    mockResponse = {} as Response
    mockResponse.status = vi.fn().mockReturnValue(mockResponse)
    mockResponse.json = vi.fn().mockReturnValue(mockResponse)

    handler = handleServerErrors(mockLogger)
  })

  it("should handle object errors", () => {
    const error = new Error("test error")

    handler(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status)
    expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse)
    expect(mockLogger.error).toHaveBeenCalledWith(expectedResponse.message, { error })
    expect(nextFunction).not.toHaveBeenCalled()
  })

  it("should handle string errors", () => {
    const error = "String error" as unknown as Error

    handler(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status)
    expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse)
    expect(mockLogger.error).toHaveBeenCalledWith(expectedResponse.message, { error })
    expect(nextFunction).not.toHaveBeenCalled()
  })

  it("should handle null/undefined errors", () => {
    const error = null as unknown as Error

    handler(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(expectedResponse.status)
    expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse)
    expect(mockLogger.error).toHaveBeenCalledWith(expectedResponse.message, { error: null })
    expect(nextFunction).not.toHaveBeenCalled()
  })
})
