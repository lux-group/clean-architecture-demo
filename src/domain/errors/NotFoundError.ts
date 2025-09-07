import { DomainError } from "./DomainError"

export class NotFoundError extends DomainError {
  constructor(message: string) {
    super(message)
    this.name = "NotFoundError"
    Error.captureStackTrace(this, this.constructor)
  }
}
