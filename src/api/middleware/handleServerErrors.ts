import { Request, Response, NextFunction } from "express"
import { Logger } from "~/infrastructure/logging"

export function handleServerErrors(logger: Logger) {
  return (err: unknown, req: Request, res: Response, next: NextFunction) => {
    logger.error("An internal server error occurred.", { error: err })
    res.status(500).json({ status: 500, message: "An internal server error occurred." })
  }
}
