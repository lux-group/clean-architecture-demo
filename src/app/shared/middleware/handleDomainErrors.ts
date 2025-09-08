import { NextFunction, Request, Response } from "express"
import { Logger } from "~/app/ports"
import {
  AuthenticationError,
  AuthorizationError,
  ConcurrencyError,
  DomainError,
  InvalidOperationError,
  NotFoundError,
  ValidationError,
} from "~/domain/errors"

export interface ErrorHandlerOptions {
  format: "Standard" | "OAuth2"
}

function formatStandardError(err: DomainError): [number, object] | undefined {
  if (err instanceof ValidationError)
    return [400, { status: 400, message: err.message, errors: err.errors }]
  if (err instanceof InvalidOperationError)
    return [400, { status: 400, message: err.message }]
  if (err instanceof AuthenticationError)
    return [401, { status: 401, message: err.message }]
  if (err instanceof AuthorizationError)
    return [403, { status: 403, message: err.message }]
  if (err instanceof NotFoundError)
    return [404, { status: 404, message: err.message }]
  if (err instanceof ConcurrencyError)
    return [409, { status: 409, message: err.message }]
  return undefined
}

function formatOAuth2Error(err: DomainError): [number, object] | undefined {
  if (err instanceof InvalidOperationError || err instanceof ValidationError)
    return [400, { error: "invalid_request", error_description: err.message }]
  if (err instanceof AuthenticationError)
    return [401, { error: "unauthorized_client", error_description: err.message }]
  if (err instanceof AuthorizationError)
    return [403, { error: "access_denied", error_description: err.message }]
  return undefined
}

// The first wrapper function is used for dependency injection.
export function handleDomainErrors(logger: Logger) {
  // The second wrapper function can be used to inject arguments into the middleware.
  return (options: ErrorHandlerOptions) => {
    // This is the actual middleware function.
    return (err: unknown, _req: Request, res: Response, next: NextFunction) => {
      logger.info(err)

      if (err instanceof DomainError) {
        const result = options.format === "Standard" ? formatStandardError(err) : formatOAuth2Error(err)
        if (result) {
          res.status(result[0]).json(result[1])
          return
        }
      }

      next(err)
    }
  }
}