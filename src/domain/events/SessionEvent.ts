import { Event } from "../adapters"
import { Session } from "../entities"

export interface SessionEventDetails {
  activity: string
  userId?: string
  sessionId?: string
  identityProviderId?: string
}

export class SessionEvent implements Event<SessionEventDetails> {
  readonly topic = "Session" as const
  readonly id: string
  readonly timestamp: Date
  readonly result: "Success" | "Failed" | "Warning"
  readonly reason?: string
  readonly details: SessionEventDetails

  private constructor(
    id: string,
    timestamp: Date,
    result: "Success" | "Failed" | "Warning",
    details: SessionEventDetails,
    reason?: string
  ) {
    this.id = id
    this.timestamp = timestamp
    this.result = result
    this.details = details
    this.reason = reason
  }

  static nonceMismatchDetected(session: Session) {
    return this.warning("Nonce mismatch indicating potential session hijacking attempt", {
      activity: "Session validation failed",
      sessionId: session.id,
      userId: session.userId,
      identityProviderId: session.identityProviderId ?? undefined,
    })
  }

  static sessionCreated(session: Session) {
    return this.success({
      activity: "Session created",
      sessionId: session.id,
      userId: session.userId,
      identityProviderId: session.identityProviderId ?? undefined,
    })
  }

  static sessionRefreshed(session: Session) {
    return this.success({
      activity: "Session refreshed",
      sessionId: session.id,
      userId: session.userId,
      identityProviderId: session.identityProviderId ?? undefined,
    })
  }

  static sessionTerminatedByUser(session: Session) {
    return this.success({
      activity: "Session terminated by user",
      sessionId: session.id,
      userId: session.userId,
      identityProviderId: session.identityProviderId ?? undefined,
    })
  }

  static sessionTerminatedByIdentityProvider(session: Session) {
    return this.success({
      activity: "Session terminated by identity provider",
      sessionId: session.id,
      userId: session.userId,
      identityProviderId: session.identityProviderId ?? undefined,
    })
  }

  private static success(details: SessionEventDetails): SessionEvent {
    return new SessionEvent(crypto.randomUUID(), new Date(), "Success", details)
  }

  private static warning(reason: string, details: SessionEventDetails): SessionEvent {
    return new SessionEvent(crypto.randomUUID(), new Date(), "Warning", details, reason)
  }
}