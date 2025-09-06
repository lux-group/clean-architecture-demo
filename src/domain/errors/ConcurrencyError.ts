export class ConcurrencyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ConcurrencyError"
    Error.captureStackTrace(this, this.constructor)
  }
}
