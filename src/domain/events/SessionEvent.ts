import { Event } from "../adapters"

export interface SessionEvent extends Event {
  topic: "Session",
  details: {
    activity: string
    userId?: string
    sessionId?: string
    identityProviderId?: string
  }
}