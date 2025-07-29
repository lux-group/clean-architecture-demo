import { Event } from "../adapters"

export interface AuthorizationEvent extends Event {
  topic: "Authorization",
  details: {
    userId?: string
    userToImpersonateId?: string
    sessionId?: string
    claims?: Record<string, unknown>
  }
}