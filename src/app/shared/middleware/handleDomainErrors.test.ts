import { mockLogger } from "@test/mocks"
import { NextFunction, Request, Response } from "express"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  AuthenticationError,
  AuthorizationError,
  ConcurrencyError,
  InvalidOperationError,
  NotFoundError,
  ValidationError,
} from "~/domain/errors"
import { handleDomainErrors } from "./handleDomainErrors"

describe("Handle Domain Errors Middleware", () => {
  const nextFunction: NextFunction = vi.fn()
  let mockRequest: Request
  let mockResponse: Response
  let handlerStandard: (err: unknown, req: Request, res: Response, next: NextFunction) => void
  let handlerOAuth2: (err: unknown, req: Request, res: Response, next: NextFunction) => void

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {} as Request
    mockResponse = {} as Response
    mockResponse.status = vi.fn().mockReturnValue(mockResponse)
    mockResponse.json = vi.fn().mockReturnValue(mockResponse)

    handlerStandard = handleDomainErrors(mockLogger)({ format: "Standard" })
    handlerOAuth2 = handleDomainErrors(mockLogger)({ format: "OAuth2" })
  })

  it("formats ValidationError as 400 with details in Standard format", () => {
    const error = new ValidationError("Invalid input", [{ message: "Email is required", path: "email" }])

    handlerStandard(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith({ status: 400, message: "Invalid input", errors: error.errors })
    expect(nextFunction).not.toHaveBeenCalled()
    expect(mockLogger.info).toHaveBeenCalledWith(error)
  })

  it("formats InvalidOperationError as 400 in Standard format", () => {
    const error = new InvalidOperationError("Operation not allowed")

    handlerStandard(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith({ status: 400, message: "Operation not allowed" })
    expect(nextFunction).not.toHaveBeenCalled()
    expect(mockLogger.info).toHaveBeenCalledWith(error)
  })

  it("formats AuthenticationError as 401 in Standard format", () => {
    const error = AuthenticationError.passwordFailed(undefined, "Wrong password")

    handlerStandard(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({ status: 401, message: error.message })
    expect(nextFunction).not.toHaveBeenCalled()
    expect(mockLogger.info).toHaveBeenCalledWith(error)
  })

  it("formats AuthorizationError as 403 in Standard format", () => {
    const error = AuthorizationError.unauthorizedScope("admin", "user-1")

    handlerStandard(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(403)
    expect(mockResponse.json).toHaveBeenCalledWith({ status: 403, message: error.message })
    expect(nextFunction).not.toHaveBeenCalled()
    expect(mockLogger.info).toHaveBeenCalledWith(error)
  })

  it("formats NotFoundError as 404 in Standard format", () => {
    const error = new NotFoundError("Resource not found")

    handlerStandard(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(404)
    expect(mockResponse.json).toHaveBeenCalledWith({ status: 404, message: "Resource not found" })
    expect(nextFunction).not.toHaveBeenCalled()
    expect(mockLogger.info).toHaveBeenCalledWith(error)
  })

  it("formats ConcurrencyError as 409 in Standard format", () => {
    const error = new ConcurrencyError("Version conflict")

    handlerStandard(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(409)
    expect(mockResponse.json).toHaveBeenCalledWith({ status: 409, message: "Version conflict" })
    expect(nextFunction).not.toHaveBeenCalled()
    expect(mockLogger.info).toHaveBeenCalledWith(error)
  })

  it("formats InvalidOperationError as OAuth2 invalid_request", () => {
    const error = new InvalidOperationError("Bad request")

    handlerOAuth2(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith({ error: "invalid_request", error_description: "Bad request" })
    expect(nextFunction).not.toHaveBeenCalled()
    expect(mockLogger.info).toHaveBeenCalledWith(error)
  })

  it("formats ValidationError as OAuth2 invalid_request with description", () => {
    const error = new ValidationError("Payload invalid")

    handlerOAuth2(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith({ error: "invalid_request", error_description: "Payload invalid" })
    expect(nextFunction).not.toHaveBeenCalled()
    expect(mockLogger.info).toHaveBeenCalledWith(error)
  })

  it("formats AuthenticationError as OAuth2 unauthorized_client", () => {
    const error = AuthenticationError.passwordFailed("user-1", "Wrong password")

    handlerOAuth2(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({ error: "unauthorized_client", error_description: error.message })
    expect(nextFunction).not.toHaveBeenCalled()
    expect(mockLogger.info).toHaveBeenCalledWith(error)
  })

  it("formats AuthorizationError as OAuth2 access_denied", () => {
    const error = AuthorizationError.unauthorizedAudience("aud", "user-1")

    handlerOAuth2(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(403)
    expect(mockResponse.json).toHaveBeenCalledWith({ error: "access_denied", error_description: error.message })
    expect(nextFunction).not.toHaveBeenCalled()
    expect(mockLogger.info).toHaveBeenCalledWith(error)
  })

  it("calls next(err) for non-domain errors", () => {
    const error = new Error("regular error")

    handlerStandard(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).not.toHaveBeenCalled()
    expect(mockResponse.json).not.toHaveBeenCalled()
    expect(nextFunction).toHaveBeenCalledWith(error)
    expect(mockLogger.info).toHaveBeenCalledWith(error)
  })

  it("calls next(err) for unmapped domain errors in OAuth2 format", () => {
    const error = new NotFoundError("not mapped in OAuth2")

    handlerOAuth2(error, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).not.toHaveBeenCalled()
    expect(mockResponse.json).not.toHaveBeenCalled()
    expect(nextFunction).toHaveBeenCalledWith(error)
    expect(mockLogger.info).toHaveBeenCalledWith(error)
  })
})
