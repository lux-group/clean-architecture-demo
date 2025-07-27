import { Event } from "../adapters"

export interface SessionEvent extends Event {
  category: "Session",
  details: {
    activity: string
    userId?: string
    sessionId?: string
    identityProviderId?: string
  }
}