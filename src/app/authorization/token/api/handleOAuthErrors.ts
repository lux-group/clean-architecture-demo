import { Request, Response, NextFunction } from "express"
import { Logger } from "~/infrastructure/logging"
import { AuthenticationError, AuthorizationError, InvalidOperationError, ValidationError } from "~/domain/errors"

const ErrorCode = {
  AccessDenied: "access_denied",
  ExpiredToken: "expired_token",
  InvalidRequest: "invalid_request",
  InvalidToken: "invalid_token",
  LoginRequired: "login_required",
  UnauthorizedClient: "unauthorized_client",
} as const

export function handleOAuthErrors(logger: Logger) {
  return (err: unknown, req: Request, res: Response, next: NextFunction) => {
    logger.info(err)

    if (err instanceof InvalidOperationError || err instanceof ValidationError) {
      res.status(400).json({ error: ErrorCode.InvalidRequest, error_description: err.message })
      return
    }

    if (err instanceof AuthenticationError) {
      res.status(401).json({ error: ErrorCode.UnauthorizedClient, error_description: err.message })
      return
    }

    if (err instanceof AuthorizationError) {
      res.status(403).json({ error: ErrorCode.AccessDenied, error_description: err.message })
      return
    }

    next(err)
  }
}