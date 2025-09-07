import { NextFunction, Request, Response } from "express"
import { Logger } from "~/app/ports"
import {
  AuthenticationError,
  AuthorizationError,
  ConcurrencyError,
  InvalidOperationError,
  NotFoundError,
  ValidationError,
} from "~/domain/errors"

export function handleClientErrors(logger: Logger) {
  return (err: unknown, _req: Request, res: Response, next: NextFunction) => {
    logger.info(err)

    if (err instanceof ValidationError) {
      res.status(400).json({ status: 400, message: err.message, errors: err.errors })
      return
    }

    if (err instanceof InvalidOperationError) {
      res.status(400).json({ status: 400, message: err.message })
      return
    }

    if (err instanceof AuthenticationError) {
      res.status(401).json({ status: 401, message: err.message })
      return
    }

    if (err instanceof AuthorizationError) {
      res.status(403).json({ status: 403, message: err.message })
      return
    }

    if (err instanceof NotFoundError) {
      res.status(404).json({ status: 404, message: err.message })
      return
    }

    if (err instanceof ConcurrencyError) {
      res.status(409).json({ status: 409, message: err.message })
      return
    }

    next(err)
  }
}
