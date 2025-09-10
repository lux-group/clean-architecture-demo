import { Logger } from "~/app/ports"
import { getRequestContext } from "~/app/shared/utils/getRequestContext"
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
        this.logger.error("Authentication failed", this.flattenAndEnrich(event))
      } else {
        this.logger.info("Authentication succeeded", this.flattenAndEnrich(event))
      }
    })

    this.eventBus.subscribe<AuthorizationEvent>("Authorization", event => {
      if (event.result === "Failed") {
        this.logger.error("Authorization failed", this.flattenAndEnrich(event))
      } else {
        this.logger.info("Authorization succeeded", this.flattenAndEnrich(event))
      }
    })

    this.eventBus.subscribe<SessionEvent>("Session", event => {
      if (event.result === "Failed") {
        this.logger.error("Session event failed", this.flattenAndEnrich(event))
      } else {
        this.logger.info("Session event succeeded", this.flattenAndEnrich(event))
      }
    })

    this.eventBus.subscribe<EntityChangeEvent>("Entity Changed", event => {
      if (event.result === "Success") {
        this.logger.error("Entity changed", this.flattenAndEnrich(event))
      }
    })
  }

  private flattenAndEnrich<T extends Event<any>>(event: T) {
    const requestContext = getRequestContext()

    return {
      eventId: event.id,
      timestamp: event.timestamp,
      actor: {
        ip: requestContext?.ipAddress,
        userAgent: requestContext?.userAgent,
        claims: requestContext?.jwtClaims,
      },
      context: {
        requestId: requestContext?.requestId,
      },
      reason: event.reason,
      ...event.details,
    }
  }
}
