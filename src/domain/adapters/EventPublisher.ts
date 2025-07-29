export interface Event {
  id: string
  timestamp: Date
  result: "Success" | "Failed" | "Warning"
  reason?: string
  details?: Record<string, any>
}

export type EventTopic = "Authentication" | "Authorization" | "Session"

export type EventCallback<T extends Event> = (event: T) => void

export interface EventPublisher {
  publishEvent<T extends Event>(topic: EventTopic, event: T): void
}
