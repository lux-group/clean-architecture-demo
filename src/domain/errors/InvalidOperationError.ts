import { DomainError } from "./DomainError"

export class InvalidOperationError extends DomainError {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }

  static identityProviderNotFound(identifier: string) {
    return new InvalidOperationError(`Identity provider ${identifier} not found.`)
  }

  static identityProviderHasNoAuthSettings(identityProviderId: string) {
    return new InvalidOperationError(
      `The identity provider ${identityProviderId} is not configured for authentication.`,
    )
  }

  static invalidRedirectUrl(identityProviderId: string, redirectUrl: string) {
    return new InvalidOperationError(
      `The identity provider ${identityProviderId} does not allow redirecting to ${redirectUrl}.`,
    )
  }

  static sessionExpired(sessionId: string) {
    return new InvalidOperationError(`Session ${sessionId} has expired or terminated.`)
  }

  static sessionMustBeLocal(sessionId: string) {
    return new InvalidOperationError(
      `The operation can only be performed for local sessions. Session ${sessionId} is not a local session.`,
    )
  }

  static sessionMustBeExternal(sessionId: string) {
    return new InvalidOperationError(
      `The operation can only be performed for identity provider sessions. Session ${sessionId} is not an identity provider session.`,
    )
  }

  static duplicateIdentity(userId: string, identityProviderId: string) {
    return new InvalidOperationError(
      `User ${userId} already has an identity from identity Provider ${identityProviderId}.`,
    )
  }

  static passwordChangeNotAllowed(userId: string, reason: string) {
    return new InvalidOperationError(`Changing password is not allowed for user ${userId}. ${reason}`)
  }

  static sessionNotFound(identifier: string) {
    return new InvalidOperationError(`Session ${identifier} not found.`)
  }

  static userNotFound(identifier: string) {
    return new InvalidOperationError(`User ${identifier} not found.`)
  }

  static userIsNotEnabled(userId: string) {
    return new InvalidOperationError(`Operation is now allowed because user ${userId} is not enabled.`)
  }
}
