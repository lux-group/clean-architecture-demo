export interface Event {
  readonly topic: string
  readonly id: string
  readonly timestamp: Date
  readonly result: "Success" | "Failed" | "Warning"
  readonly reason?: string
  readonly details?: Record<string, any>
}

export type EventTopic = "Authentication" | "Authorization" | "Session"

export type EventCallback<T extends Event> = (event: T) => void

export interface EventPublisher {
  publishEvent(event: Event): void
}
