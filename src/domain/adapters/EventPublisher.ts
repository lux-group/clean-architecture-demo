export interface Event {
  id: string
  timestamp: Date
  category: "Authentication" | "Authorization" | "Session" | "User"
  result: "Success" | "Failed" | "Warning"
  reason?: string
  details?: Record<string, any>
}

export interface EventPublisher {
  publishEvent<T extends Event>(event: T): void
}
