export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AuthenticationError"
    Error.captureStackTrace(this, this.constructor)
  }
}
