import { aliasTo, asClass, AwilixContainer } from "awilix"
import { EventBus } from "./adapters/EventBus"
import { EventLoggerAdapter } from "./adapters/EventLoggerAdapter"
import { BCryptPasswordVerifier } from "./adapters/BCryptPasswordVerifier"
import { JsonWebTokenIssuer } from "./adapters/JsonWebTokenIssuer"
import { JsonWebTokenValidator } from "./adapters/JsonWebTokenValidator"
import { ClientFactory } from "./auth/ClientFactory"
import { NodeEncryptionProvider } from "./crypto/NodeEncryptionProvider"
import { NodeKeyPairGenerator } from "./crypto/NodeKeyPairGenerator"
import { ConsoleLogger } from "./logging/ConsoleLogger"

export default function registerInfrastructureServices(container: AwilixContainer) {
  container.register({
    eventPublisher: aliasTo("eventBus"),
    eventBus: asClass(EventBus).singleton(),
    passwordVerifier: asClass(BCryptPasswordVerifier).singleton(),
    tokenIssuer: asClass(JsonWebTokenIssuer).singleton(),
    tokenValidator: asClass(JsonWebTokenValidator).singleton(),    
    authClientFactory: asClass(ClientFactory).singleton(),
    logger: asClass(ConsoleLogger).singleton(),
    encryptionProvider: asClass(NodeEncryptionProvider).singleton(),
    keyPairGenerator: asClass(NodeKeyPairGenerator).singleton(),
  })

  // Instantiate and start the EventLoggerAdapter
  // that subscribes to all domain events and logs them.
  const eventBus = container.resolve<EventBus>("eventBus")
  const logger = container.resolve<ConsoleLogger>("logger")

  const eventLogger = new EventLoggerAdapter(eventBus, logger)
  eventLogger.start()
}
