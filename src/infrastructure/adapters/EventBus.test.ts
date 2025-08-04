import { beforeEach, describe, expect, it, vi } from "vitest"
import { Event } from "~/domain/adapters"
import { EventBus } from "./EventBus"
import { AuthenticationEventDetails } from "~/domain/events/AuthenticationEvent"
import { SessionEventDetails } from "~/domain/events/SessionEvent"

describe("EventBus", () => {
  let eventBus: EventBus

  beforeEach(() => {
    eventBus = new EventBus()
  })

  describe("subscribe", () => {
    it("should allow subscribing to a category", () => {
      const callback = vi.fn()

      eventBus.subscribe("Authentication", callback)
    })

    it("should allow multiple callbacks for the same category", () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      eventBus.subscribe("Authentication", callback1)
      eventBus.subscribe("Authentication", callback2)

      const testEvent: Event<AuthenticationEventDetails> = {
        topic: "Authentication",
        id: "test-1",
        timestamp: new Date(),
        result: "Success"
      }

      eventBus.publishEvent(testEvent)

      expect(callback1).toHaveBeenCalledWith(testEvent)
      expect(callback2).toHaveBeenCalledWith(testEvent)
    })

    it("should allow subscribing to different categories", () => {
      const authCallback = vi.fn()
      const sessionCallback = vi.fn()

      eventBus.subscribe("Authentication", authCallback)
      eventBus.subscribe("Session", sessionCallback)

      const authEvent: Event<AuthenticationEventDetails> = {
        topic: "Authentication",
        id: "auth-1",
        timestamp: new Date(),
        result: "Success"
      }

      const sessionEvent: Event<SessionEventDetails> = {
        topic: "Session",
        id: "session-1",
        timestamp: new Date(),
        result: "Success"
      }

      eventBus.publishEvent(authEvent)
      eventBus.publishEvent(sessionEvent)

      expect(authCallback).toHaveBeenCalledWith(authEvent)
      expect(authCallback).not.toHaveBeenCalledWith(sessionEvent)
      expect(sessionCallback).toHaveBeenCalledWith(sessionEvent)
      expect(sessionCallback).not.toHaveBeenCalledWith(authEvent)
    })

    it("should handle duplicate callback registrations", () => {
      const callback = vi.fn()

      eventBus.subscribe("Authentication", callback)
      eventBus.subscribe("Authentication", callback)

      const testEvent: Event<AuthenticationEventDetails> = {
        topic: "Authentication",
        id: "test-1",
        timestamp: new Date(),
        result: "Success"
      }

      eventBus.publishEvent(testEvent)

      // Should only be called once despite being registered twice
      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(testEvent)
    })
  })

  describe("unsubscribe", () => {
    it("should remove a callback from a category", () => {
      const callback = vi.fn()

      eventBus.subscribe("Authentication", callback)
      eventBus.unsubscribe("Authentication", callback)

      const testEvent: Event<AuthenticationEventDetails> = {
        topic: "Authentication",
        id: "test-1",
        timestamp: new Date(),
        result: "Success"
      }

      eventBus.publishEvent(testEvent)

      expect(callback).not.toHaveBeenCalled()
    })

    it("should only remove the specified callback", () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      eventBus.subscribe("Authentication", callback1)
      eventBus.subscribe("Authentication", callback2)
      eventBus.unsubscribe("Authentication", callback1)

      const testEvent: Event<AuthenticationEventDetails> = {
        topic: "Authentication",
        id: "test-1",
        timestamp: new Date(),
        result: "Success"
      }

      eventBus.publishEvent(testEvent)

      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).toHaveBeenCalledWith(testEvent)
    })

    it("should handle unsubscribing non-existent callback", () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      eventBus.subscribe("Authentication", callback1)

      expect(() => eventBus.unsubscribe("Authentication", callback2)).not.toThrow()
    })
  })

  describe("publishEvent", () => {
    it("should publish event to subscribed callbacks", () => {
      const callback = vi.fn()
      eventBus.subscribe("Authentication", callback)

      const testEvent: Event<AuthenticationEventDetails> = {
        topic: "Authentication",
        id: "test-1",
        timestamp: new Date(),
        result: "Success",
        reason: "Valid credentials",
        details: { method: "Active Session", userId: "123" }
      }

      eventBus.publishEvent(testEvent)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(testEvent)
    })

    it("should publish to all subscribers of a category", () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      const callback3 = vi.fn()

      eventBus.subscribe("Authentication", callback1)
      eventBus.subscribe("Authentication", callback2)
      eventBus.subscribe("Authentication", callback3)

      const testEvent: Event<AuthenticationEventDetails> = {
        topic: "Authentication",
        id: "test-1",
        timestamp: new Date(),
        result: "Success"
      }

      eventBus.publishEvent(testEvent)

      expect(callback1).toHaveBeenCalledWith(testEvent)
      expect(callback2).toHaveBeenCalledWith(testEvent)
      expect(callback3).toHaveBeenCalledWith(testEvent)
    })
  })
})

