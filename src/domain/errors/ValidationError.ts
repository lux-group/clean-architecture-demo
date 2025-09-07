import { DomainError } from "./DomainError"

export interface ValidationErrorItem {
  message: string
  path?: string
  value?: unknown
}

export class ValidationError extends DomainError {
  constructor(
    message: string,
    public readonly errors: ValidationErrorItem[] = [],
  ) {
    super(message)
    this.name = "ValidationError"
    Error.captureStackTrace(this, this.constructor)
  }
}
