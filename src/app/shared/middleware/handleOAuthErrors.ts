import { NextFunction, Request, Response } from "express"
import { AuthenticationError, AuthorizationError, InvalidOperationError, ValidationError } from "~/domain/errors"
import { Logger } from "~/infrastructure/logging"

const ErrorCode = {
  AccessDenied: "access_denied",
  ExpiredToken: "expired_token",
  InvalidRequest: "invalid_request",
  InvalidToken: "invalid_token",
  LoginRequired: "login_required",
  UnauthorizedClient: "unauthorized_client",
} as const

// The first wrapper function is used for dependency injection.
export function handleOAuthErrors(logger: Logger) {
  // The second wrapper function is used by the decorator to inject arguments.
  // This middleware doesn't have any though but we still need to wrap it.
  return () => {
    return (err: unknown, _req: Request, res: Response, next: NextFunction) => {
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
}
