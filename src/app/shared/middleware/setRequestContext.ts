import { randomUUID } from "node:crypto"
import { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import { Logger } from "~/app/ports"
import { contextStorage, RequestContext } from "../utils/getRequestContext"

export function setRequestContext(logger: Logger) {
  const extractRequestId = (req: Request) => req.get("x-request-id") || randomUUID()

  const extractUserAgent = (req: Request) => req.get("user-agent") || undefined

  const extractIPAddress = (req: Request) =>
    req.get("geo-real-ip") ||
    req.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.get("x-real-ip") ||
    req.get("x-client-ip") ||
    req.ip ||
    req.socket.remoteAddress ||
    undefined

  const extractJWTClaims = (req: Request) => {
    try {
      const authHeader = req.get("authorization")
      if (!authHeader) {
        return undefined
      }

      if (!authHeader.startsWith("Bearer ")) {
        return undefined
      }

      const token = authHeader.substring(7)
      if (!token) {
        return undefined
      }

      return jwt.decode(token) as Record<string, unknown>
    } catch (error) {
      logger.warn("Failed to extract JWT claims:", error)
      return undefined
    }
  }

  return (req: Request, _res: Response, next: NextFunction): void => {
    const claims = extractJWTClaims(req)

    const context: RequestContext = {
      requestId: extractRequestId(req),
      ipAddress: extractIPAddress(req),
      userAgent: extractUserAgent(req),
      user: claims
        ? {
            id: claims.sub as string,
            claims,
          }
        : undefined,
    }

    contextStorage.run(context, () => {
      next()
    })
  }
}
