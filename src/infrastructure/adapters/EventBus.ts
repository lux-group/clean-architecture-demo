import { Event, EventCallback, EventPublisher, EventTopic } from "~/domain/adapters"

export class EventBus implements EventPublisher {
  private subscribers: Map<EventTopic, Set<EventCallback<any>>> = new Map()

  subscribe<T extends Event>(topic: EventTopic, callback: EventCallback<T>): void {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set())
    }
    this.subscribers.get(topic)!.add(callback)
  }

  unsubscribe<T extends Event>(topic: EventTopic, callback: EventCallback<T>): void {
    const callbacks = this.subscribers.get(topic)
    if (callbacks) {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        this.subscribers.delete(topic)
      }
    }
  }

  publishEvent(event: Event): void {
    const callbacks = this.subscribers.get(event.topic as EventTopic)
    if (callbacks) {
      callbacks.forEach(callback => callback(event))
    }
  }
}
