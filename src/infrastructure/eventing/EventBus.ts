import { EventCallback, EventPublisher } from "~/app/shared/adapters"
import { Event } from "~/domain/events"

export class EventBus implements EventPublisher {
  private subscribers: Map<string, Set<EventCallback<any>>> = new Map()

  subscribe<T extends Event<any>>(topic: string, callback: EventCallback<T>): void {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set())
    }
    this.subscribers.get(topic)!.add(callback)
  }

  unsubscribe<T extends Event<any>>(topic: string, callback: EventCallback<T>): void {
    const callbacks = this.subscribers.get(topic)
    if (callbacks) {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        this.subscribers.delete(topic)
      }
    }
  }

  publishEvent<T extends Event<any>>(event: T): void {
    const callbacks = this.subscribers.get(event.topic)
    if (callbacks) {
      callbacks.forEach(callback => callback(event))
    }
  }
}
