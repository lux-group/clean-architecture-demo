import { DomainError } from "./DomainError"

export class ConcurrencyError extends DomainError {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}
