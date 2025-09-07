import { DomainError } from "./DomainError"

export class ConcurrencyError extends DomainError {
  constructor(message: string) {
    super(message)
    this.name = "ConcurrencyError"
    Error.captureStackTrace(this, this.constructor)
  }
}
