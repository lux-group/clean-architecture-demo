import { NextFunction, Request, Response } from "express"
import { Logger } from "~/app/shared/adapters"

export function handleServerErrors(logger: Logger) {
  return (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    logger.error("An internal server error occurred.", { error: err })
    res.status(500).json({ status: 500, message: "An internal server error occurred." })
  }
}
