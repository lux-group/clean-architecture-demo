export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AuthorizationError"
    Error.captureStackTrace(this, this.constructor)
  }
}
