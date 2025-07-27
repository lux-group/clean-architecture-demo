import { Event } from "../adapters"

export interface AuthenticationEvent extends Event {
  category: "Authentication",
  details: {
    userId?: string
    sessionId?: string
    identityProviderId?: string
    identifierClaimValue?: string
    method: "Active Session" | "Password" | "Client Credentials" | "Identity Provider"
  }
}