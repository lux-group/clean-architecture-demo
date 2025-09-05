import { randomUUID } from "node:crypto"
import { Event } from "../adapters"
import { Session, User } from "../entities"

export interface AuthorizationEventDetails {
  userId?: string
  userToImpersonateId?: string
  sessionId?: string
  claims?: Record<string, unknown>
}

export class AuthorizationEvent implements Event<AuthorizationEventDetails> {
  readonly topic = "Authorization" as const
  readonly id: string
  readonly timestamp: Date
  readonly result: "Success" | "Failed" | "Warning"
  readonly reason?: string
  readonly details: AuthorizationEventDetails

  private constructor(
    id: string,
    timestamp: Date,
    result: "Success" | "Failed" | "Warning",
    details: AuthorizationEventDetails,
    reason?: string,
  ) {
    this.id = id
    this.timestamp = timestamp
    this.result = result
    this.details = details
    this.reason = reason
  }

  static tokenIssued(session?: Session, claims?: Record<string, unknown>) {
    return AuthorizationEvent.success({
      sessionId: session?.id,
      userId: session?.userId,
      claims,
    })
  }

  static impersonationFailed(impersonatingUser: User, userToImpersonate: User, session?: Session) {
    return AuthorizationEvent.failed("Impersonation not allowed", {
      sessionId: session?.id,
      userId: impersonatingUser.id,
      userToImpersonateId: userToImpersonate.id,
    })
  }

  private static success(details: AuthorizationEventDetails): AuthorizationEvent {
    return new AuthorizationEvent(randomUUID(), new Date(), "Success", details)
  }

  private static failed(reason: string, details: AuthorizationEventDetails): AuthorizationEvent {
    return new AuthorizationEvent(randomUUID(), new Date(), "Failed", details, reason)
  }
}
