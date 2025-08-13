import { randomUUID } from "node:crypto"
import { commonErrors } from "~/domain/errors"
import { Event } from "../adapters"
import { Session, User } from "../entities"

export interface AuthenticationEventDetails {
  userId?: string
  sessionId?: string
  identityProviderId?: string
  identifierClaimValue?: string
  method: "Active Session" | "Password" | "Client Credentials" | "Identity Provider"
}

export class AuthenticationEvent implements Event<AuthenticationEventDetails> {
  readonly topic = "Authentication" as const
  readonly id: string
  readonly timestamp: Date
  readonly result: "Success" | "Failed"
  readonly reason?: string
  readonly details: AuthenticationEventDetails

  private constructor(
    id: string,
    timestamp: Date,
    result: "Success" | "Failed",
    details: AuthenticationEventDetails,
    reason?: string
  ) {
    this.id = id
    this.timestamp = timestamp
    this.result = result
    this.details = details
    this.reason = reason
  }

  static activeSessionSuccess(session: Session) {
    return this.success({
      method: "Active Session",
      userId: session.userId,
      sessionId: session.id
    })
  }

  static activeSessionExpired(session: Session) {
    return this.failed(commonErrors.sessionExpired, {
      method: "Active Session",
      userId: session.userId,
      sessionId: session.id
    })
  }

  static activeSessionFailed(session: Session) {
    return this.failed(commonErrors.authenticationFailed, {
      method: "Active Session",
      userId: session.userId,
      sessionId: session.id
    })
  }

  static activeSessionMethodNotAllowed(session: Session) {
    return this.failed(commonErrors.authenticationMethodNotAllowed, {
      method: "Active Session",
      userId: session.userId,
      sessionId: session.id
    })
  }

  static passwordSuccess(user: User) {
    return this.success({
      method: "Password",
      userId: user.id,
    })
  }

  static passwordFailed(user?: User) {
    return this.failed(commonErrors.authenticationFailed, {
      method: "Password",
      userId: user?.id,
    })
  }

  static passwordMethodNotAllowed(user: User) {
    return this.failed(commonErrors.authenticationMethodNotAllowed, {
      method: "Password",
      userId: user.id,
    })
  }

  static clientCredentialsSuccess(user: User) {
    return this.success({
      method: "Client Credentials",
      userId: user.id
    })
  }

  static clientCredentialsFailed(clientId: string) {
    return this.failed(commonErrors.authenticationFailed, {
      method: "Client Credentials",
      userId: clientId
    })
  }

  static clientCredentialsMethodNotAllowed(clientId: string) {
    return this.failed(commonErrors.authenticationMethodNotAllowed, {
      method: "Client Credentials",
      userId: clientId
    })
  }

  static identityProviderSuccess(user: User, identityProviderId: string, identifierClaimValue: string) {
    return this.success({
      method: "Identity Provider",
      userId: user.id,
      identityProviderId,
      identifierClaimValue
    })
  }

  static identityProviderFailed(identityProviderId: string, identifierClaimValue: string) {
    return this.failed(commonErrors.authenticationFailed, {
      method: "Identity Provider",
      identityProviderId,
      identifierClaimValue
    })
  }

  static identityProviderMethodNotAllowed(user: User, identityProviderId: string, identifierClaimValue: string) {
    return this.failed(commonErrors.authenticationMethodNotAllowed, {
      method: "Identity Provider",
      userId: user.id,
      identityProviderId,
      identifierClaimValue
    })
  }

  static identityProviderTokenFailed() {
    return this.failed(commonErrors.authenticationFailed, { method: "Identity Provider" })
  }

  private static success(details: AuthenticationEventDetails): AuthenticationEvent {
    return new AuthenticationEvent(
      randomUUID(),
      new Date(),
      "Success",
      details
    )
  }

  private static failed(reason: string, details: AuthenticationEventDetails): AuthenticationEvent {
    return new AuthenticationEvent(
      randomUUID(),
      new Date(),
      "Failed",
      details,
      reason
    )
  }
}