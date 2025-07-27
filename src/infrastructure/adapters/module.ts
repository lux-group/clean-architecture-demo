import { asClass, AwilixContainer } from "awilix"
import { Logger } from "~/infrastructure/logging"
import { EventBus } from "./EventBus"
import { DomainEventLoggerAdapter } from "./EventLoggerAdapter"
import { BCryptPasswordVerifier } from "./BCryptPasswordVerifier"
import { JsonWebTokenIssuer } from "./JsonWebTokenIssuer"
import { JsonWebTokenValidator } from "./JsonWebTokenValidator"

export default function registerDomainAdapters(container: AwilixContainer) {
  container.register({
    eventPublisher: asClass(EventBus).singleton(),
    passwordVerifier: asClass(BCryptPasswordVerifier).singleton(),
    tokenIssuer: asClass(JsonWebTokenIssuer).singleton(),
    tokenValidator: asClass(JsonWebTokenValidator).singleton(),
  })

  // Instantiate and start the DomainEventLoggerAdapter
  // that subscribes to all domain events and logs them.
  const eventBus = container.resolve<EventBus>("eventPublisher")
  const logger = container.resolve<Logger>("logger")

  const domainEventLogger = new DomainEventLoggerAdapter(eventBus, logger)
  domainEventLogger.start()
}
