import { Logger } from "~/app/adapters"
import { AuthenticationEvent, AuthorizationEvent, Event, SessionEvent } from "~/domain/events"
import { EntityChangeEvent } from "~/domain/events/EntityChangeEvent"
import { EventBus } from "./EventBus"

export class EventLoggerAdapter {
  constructor(
    private readonly eventBus: EventBus,
    private readonly logger: Logger,
  ) {}

  public start() {
    this.eventBus.subscribe<AuthenticationEvent>("Authentication", event => {
      if (event.result === "Failed") {
        this.logger.error("Authentication failed", this.flattenDetails(event))
      } else {
        this.logger.info("Authentication succeeded", this.flattenDetails(event))
      }
    })

    this.eventBus.subscribe<AuthorizationEvent>("Authorization", event => {
      if (event.result === "Failed") {
        this.logger.error("Authorization failed", this.flattenDetails(event))
      } else {
        this.logger.info("Authorization succeeded", this.flattenDetails(event))
      }
    })

    this.eventBus.subscribe<SessionEvent>("Session", event => {
      if (event.result === "Failed") {
        this.logger.error("Session event failed", this.flattenDetails(event))
      } else {
        this.logger.info("Session event succeeded", this.flattenDetails(event))
      }
    })

    this.eventBus.subscribe<EntityChangeEvent>("Entity Changed", event => {
      if (event.result === "Success") {
        this.logger.error("Entity changed", this.flattenDetails(event))
      }
    })
  }

  private flattenDetails<T extends Event<any>>(event: T) {
    return {
      eventId: event.id,
      timestamp: event.timestamp,
      reason: event.reason,
      ...event.details,
    }
  }
}
