import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextFunction, Request, Response } from "express"
import jwt, { JwtPayload } from "jsonwebtoken"
import { mockLogger, mockSigningKeyRepository } from "@test/mocks"
import { authorize } from "./authorize"
import { TokenIssuerConfig } from "~/domain/adapters"
import { UUIDToShort } from "~/lib/ShortUUID"

describe("Authorize Middleware", () => {
  const nextFunction: NextFunction = vi.fn()
  let mockRequest: Request
  let mockResponse: Response
  let tokenIssuerConfig: TokenIssuerConfig

  const baseUrl = "https://example.com"

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = { headers: {} } as unknown as Request
    mockResponse = {} as Response
    mockResponse.status = vi.fn().mockReturnValue(mockResponse)
    mockResponse.send = vi.fn().mockReturnValue(mockResponse)

    tokenIssuerConfig = {
      path: "/oauth/token",
      lifetimeSeconds: 3600,
      audience: "my-audience",
    }
  })

  const createHandler = (options: { roles?: string[]; scopes?: string[] } = {}) =>
    authorize(baseUrl, mockLogger, tokenIssuerConfig, mockSigningKeyRepository)(options)

  const setAuthHeader = (token = "test-token") => {
    mockRequest.headers = { authorization: `Bearer ${token}` }
  }

  const mockDecoded = (overrides?: Partial<JwtPayload> & { kid?: string }) => {
    const payload: JwtPayload = {
      sub: "user-123",
      scope: "read write",
      roles: ["user"],
      ...overrides,
    } as unknown as JwtPayload

    const header: jwt.JwtHeader = {
      alg: "RS256",
      typ: "JWT",
      ...(overrides?.kid ? { kid: overrides.kid } : {}),
    }

    vi.spyOn(jwt, "decode").mockReturnValue({ header, payload } as unknown as jwt.Jwt)
    return { header, payload }
  }

  it("returns 401 when Authorization header is missing", async () => {
    const handler = createHandler()

    await handler(mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.send).toHaveBeenCalled()
    expect(nextFunction).not.toHaveBeenCalled()
  })

  it("returns 401 and logs warn when token is invalid (decode throws)", async () => {
    setAuthHeader()
    vi.spyOn(jwt, "decode").mockImplementation(() => { throw new Error("bad token") })

    const handler = createHandler()
    await handler(mockRequest, mockResponse, nextFunction)

    expect(mockLogger.warn).toHaveBeenCalledWith("Received invalid access token")
    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.send).toHaveBeenCalled()
    expect(nextFunction).not.toHaveBeenCalled()
  })

  it("returns 401 and logs warn when kid is missing", async () => {
    setAuthHeader()
    mockDecoded() // no kid on purpose

    const handler = createHandler()
    await handler(mockRequest, mockResponse, nextFunction)

    expect(mockLogger.warn).toHaveBeenCalledWith("Received access token without key-id")
    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.send).toHaveBeenCalled()
  })

  it("returns 401 and logs warn when signing key is unknown", async () => {
    setAuthHeader()
    const uuid = "123e4567-e89b-12d3-a456-426614174000"
    const short = UUIDToShort(uuid)
    mockDecoded({ kid: short })

    ;(mockSigningKeyRepository.tryGetById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)

    const handler = createHandler()
    await handler(mockRequest, mockResponse, nextFunction)

    expect(mockSigningKeyRepository.tryGetById).toHaveBeenCalledWith(uuid)
    expect(mockLogger.warn).toHaveBeenCalledWith(`Received access token with unknown key-id ${short}`)
    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.send).toHaveBeenCalled()
  })

  it("returns 401 when verification fails", async () => {
    setAuthHeader()
    const uuid = "123e4567-e89b-12d3-a456-426614174001"
    const short = UUIDToShort(uuid)
    mockDecoded({ kid: short })

    ;(mockSigningKeyRepository.tryGetById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ publicKey: "PUBLIC" })
    vi.spyOn(jwt, "verify").mockImplementation(() => { throw new Error("invalid signature") })

    const handler = createHandler()
    await handler(mockRequest, mockResponse, nextFunction)

    expect(mockLogger.info).toHaveBeenCalled()
    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.send).toHaveBeenCalled()
  })

  it("returns 403 when required roles are not present", async () => {
    setAuthHeader()
    const uuid = "123e4567-e89b-12d3-a456-426614174002"
    const short = UUIDToShort(uuid)
    mockDecoded({ kid: short, roles: ["user"] as unknown as JwtPayload["roles"] })

    ;(mockSigningKeyRepository.tryGetById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ publicKey: "PUBLIC" })
    vi.spyOn(jwt, "verify").mockImplementation(() => undefined as unknown as jwt.Jwt)

    const handler = createHandler({ roles: ["admin"] })
    await handler(mockRequest, mockResponse, nextFunction)

    expect(mockLogger.info).toHaveBeenCalled()
    expect(mockResponse.status).toHaveBeenCalledWith(403)
    expect(mockResponse.send).toHaveBeenCalled()
  })

  it("returns 403 when required scopes are not present", async () => {
    setAuthHeader()
    const uuid = "123e4567-e89b-12d3-a456-426614174003"
    const short = UUIDToShort(uuid)
    mockDecoded({ kid: short, scope: "read write" })

    ;(mockSigningKeyRepository.tryGetById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ publicKey: "PUBLIC" })
    vi.spyOn(jwt, "verify").mockImplementation(() => undefined as unknown as jwt.Jwt)

    const handler = createHandler({ scopes: ["admin"] })
    await handler(mockRequest, mockResponse, nextFunction)

    expect(mockLogger.info).toHaveBeenCalled()
    expect(mockResponse.status).toHaveBeenCalledWith(403)
    expect(mockResponse.send).toHaveBeenCalled()
  })

  it("calls next when token is valid and required role is present", async () => {
    setAuthHeader()
    const uuid = "123e4567-e89b-12d3-a456-426614174004"
    const short = UUIDToShort(uuid)
    mockDecoded({ kid: short, roles: ["user", "admin"] as unknown as JwtPayload["roles"], scope: "read write" })

    ;(mockSigningKeyRepository.tryGetById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ publicKey: "PUBLIC" })
    vi.spyOn(jwt, "verify").mockImplementation(() => undefined as unknown as jwt.Jwt)

    const handler = createHandler({ roles: ["admin"] })
    await handler(mockRequest, mockResponse, nextFunction)

    expect(nextFunction).toHaveBeenCalled()
    expect(mockResponse.status).not.toHaveBeenCalled()
  })

  it("calls next when token is valid and required scope is present", async () => {
    setAuthHeader()
    const uuid = "123e4567-e89b-12d3-a456-426614174005"
    const short = UUIDToShort(uuid)
    mockDecoded({ kid: short, scope: "read write users.read" })

    ;(mockSigningKeyRepository.tryGetById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ publicKey: "PUBLIC" })
    vi.spyOn(jwt, "verify").mockImplementation(() => undefined as unknown as jwt.Jwt)

    const handler = createHandler({ scopes: ["users.read"] })
    await handler(mockRequest, mockResponse, nextFunction)

    expect(nextFunction).toHaveBeenCalled()
    expect(mockResponse.status).not.toHaveBeenCalled()
  })
})


