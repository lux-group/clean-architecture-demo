import { aliasTo, asClass, AwilixContainer } from "awilix"
import { Logger } from "~/infrastructure/logging"
import { EventBus } from "./EventBus"
import { EventLoggerAdapter } from "./EventLoggerAdapter"
import { BCryptPasswordVerifier } from "./BCryptPasswordVerifier"
import { JsonWebTokenIssuer } from "./JsonWebTokenIssuer"
import { JsonWebTokenValidator } from "./JsonWebTokenValidator"

export default function registerDomainAdapters(container: AwilixContainer) {
  container.register({
    eventBus: asClass(EventBus).singleton(),
    eventPublisher: aliasTo("eventBus"),
    passwordVerifier: asClass(BCryptPasswordVerifier).singleton(),
    tokenIssuer: asClass(JsonWebTokenIssuer).singleton(),
    tokenValidator: asClass(JsonWebTokenValidator).singleton(),
  })

  // Instantiate and start the EventLoggerAdapter
  // that subscribes to all domain events and logs them.
  const eventBus = container.resolve<EventBus>("eventBus")
  const logger = container.resolve<Logger>("logger")

  const eventLogger = new EventLoggerAdapter(eventBus, logger)
  eventLogger.start()
}
