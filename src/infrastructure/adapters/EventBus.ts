import { Event, EventPublisher } from "~/domain/adapters"

type EventCallback<T extends Event> = (event: T) => void

export class EventBus implements EventPublisher {
  private subscribers: Map<string, Set<EventCallback<any>>> = new Map()
 
  subscribe<T extends Event>(category: string, callback: EventCallback<T>): void {
    if (!this.subscribers.has(category)) {
      this.subscribers.set(category, new Set())
    }
    this.subscribers.get(category)!.add(callback)
  }

  unsubscribe<T extends Event>(category: string, callback: EventCallback<T>): void {
    const callbacks = this.subscribers.get(category)
    if (callbacks) {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        this.subscribers.delete(category)
      }
    }
  }

  publishEvent<T extends Event>(event: T): void {
    const callbacks = this.subscribers.get(event.category)
    if (callbacks) {
      callbacks.forEach(callback => callback(event))
    }
  }
}
