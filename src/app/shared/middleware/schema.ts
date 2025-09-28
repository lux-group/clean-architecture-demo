import { NextFunction, Request, Response } from "express"
import { ZodSchema, ZodType } from "zod"

export interface SchemaOptions {
  query?: ZodType
  params?: ZodType
  requestBody?: ZodType
  responseBody?: ZodType
}

const validate = (validationSchema: ZodSchema, value: object, res: Response) => {
  const result = validationSchema.safeParse(value)
  if (!result.success) {
    res.status(400).json({
      status: 400,
      message: "Invalid parameters",
      errors: result.error.issues.map(issue => ({
        message: issue.message,
        path: issue.path.join("."),
      })),
    })

    return false
  }

  return true
}

// The first wrapper function is used for dependency injection.
export function schema() {
  // The second wrapper function is used to inject arguments into the middleware.
  return (options?: SchemaOptions) => {
    // This is the actual middleware function.
    return (req: Request, res: Response, next: NextFunction) => {
      if (options?.params && !validate(options.params, req.params, res)) {
        return
      }

      if (options?.query && !validate(options.query, req.query, res)) {
        return
      }

      if (options?.requestBody && !validate(options.requestBody, req.body, res)) {
        return
      }

      next()
    }
  }
}
