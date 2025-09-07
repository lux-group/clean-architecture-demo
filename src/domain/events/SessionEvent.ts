import { randomUUID } from "node:crypto"
import { Session } from "../entities"
import { Event } from "./Event"

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
  readonly result: "Success" | "Failed"
  readonly reason?: string
  readonly details: SessionEventDetails

  private constructor(
    id: string,
    timestamp: Date,
    result: "Success" | "Failed",
    details: SessionEventDetails,
    reason?: string,
  ) {
    this.id = id
    this.timestamp = timestamp
    this.result = result
    this.details = details
    this.reason = reason
  }

  static sessionCreated(session: Session) {
    return SessionEvent.success({
      activity: "Session created",
      sessionId: session.id,
      userId: session.userId,
      identityProviderId: session.identityProviderId ?? undefined,
    })
  }

  static sessionRefreshed(session: Session) {
    return SessionEvent.success({
      activity: "Session refreshed",
      sessionId: session.id,
      userId: session.userId,
      identityProviderId: session.identityProviderId ?? undefined,
    })
  }

  static sessionTerminatedByUser(session: Session) {
    return SessionEvent.success({
      activity: "Session terminated by user",
      sessionId: session.id,
      userId: session.userId,
      identityProviderId: session.identityProviderId ?? undefined,
    })
  }

  static sessionTerminatedByIdentityProvider(session: Session) {
    return SessionEvent.success({
      activity: "Session terminated by identity provider",
      sessionId: session.id,
      userId: session.userId,
      identityProviderId: session.identityProviderId ?? undefined,
    })
  }

  private static success(details: SessionEventDetails): SessionEvent {
    return new SessionEvent(randomUUID(), new Date(), "Success", details)
  }
}
