import { randomUUID } from "node:crypto"
import { AuthenticationEvent, AuthenticationEventDetails } from "../events"
import { DomainError } from "./DomainError"

export class AuthenticationError extends DomainError {
  constructor(
    message: string,
    public readonly details: AuthenticationEventDetails,
  ) {
    super(message)
    this.name = "AuthenticationError"
    Error.captureStackTrace(this, this.constructor)
  }

  static activeSessionCookieNotFound() {
    return new AuthenticationError("Cookie not found.", {
      method: "Active Session",
    })
  }

  static activeSessionCookieInvalid() {
    return new AuthenticationError("Cookie is invalid.", {
      method: "Active Session",
    })
  }

  static sessionExpired(sessionId: string, userId?: string) {
    return new AuthenticationError("Session has expired or terminated.", {
      method: "Active Session",
      sessionId,
      userId,
    })
  }

  static activeSessionFailed(sessionId: string, userId: string | undefined, reason: string) {
    return new AuthenticationError(`Session authentication failed. ${reason}`, {
      method: "Active Session",
      sessionId,
      userId,
    })
  }

  static passwordFailed(userId: string | undefined, reason: string) {
    return new AuthenticationError(`Password authentication failed. ${reason}`, {
      method: "Password",
      userId,
    })
  }

  static clientCredentialsFailed(userId: string | undefined, reason: string) {
    return new AuthenticationError(`Client crednetials authentication failed. ${reason}`, {
      method: "Client Credentials",
      userId,
    })
  }

  static tokenExchangeFailed(identityProviderId: string | undefined, userId: string | undefined, reason?: string) {
    return new AuthenticationError(`Token exchange authentication failed. ${reason}`, {
      method: "Token Exchange",
      identityProviderId,
      userId,
    })
  }

  static identityProviderFailed(identityProviderId: string, userId: string | undefined, reason: string) {
    return new AuthenticationError(`Identity provider authentication failed. ${reason}`, {
      method: "Identity Provider",
      identityProviderId,
      userId,
    })
  }

  static invalidIdentityProviderResponse(reason: string) {
    return new AuthenticationError(`Invalid response from identity provider. ${reason}`, {
      method: "Identity Provider",
    })
  }

  toEvent() {
    return new AuthenticationEvent(randomUUID(), new Date(), "Failed", this.details, this.message)
  }
}
