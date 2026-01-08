import { AwilixContainer, aliasTo, asClass } from 'awilix';
import { ClientFactory } from './auth/ClientFactory';
import { BCryptPasswordVerifier } from './crypto/BCryptPasswordVerifier';
import { NodeEncryptionProvider } from './crypto/NodeEncryptionProvider';
import { NodeKeyPairGenerator } from './crypto/NodeKeyPairGenerator';
import { EventBus } from './eventing/EventBus';
import { EventLoggerAdapter } from './eventing/EventLoggerAdapter';
import { ConsoleLogger } from './logging/ConsoleLogger';
import { JsonWebTokenIssuer } from './tokens/JsonWebTokenIssuer';
import { JsonWebTokenValidator } from './tokens/JsonWebTokenValidator';

export default async function registerInfrastructureServices(container: AwilixContainer) {
  container.register({
    authClientFactory: asClass(ClientFactory).singleton(),
    eventBus: asClass(EventBus).singleton(),
    eventPublisher: aliasTo('eventBus'),
    encryptionProvider: asClass(NodeEncryptionProvider).singleton(),
    keyPairGenerator: asClass(NodeKeyPairGenerator).singleton(),
    passwordVerifier: asClass(BCryptPasswordVerifier).singleton(),
    logger: asClass(ConsoleLogger).singleton(),
    tokenIssuer: asClass(JsonWebTokenIssuer).singleton(),
    tokenValidator: asClass(JsonWebTokenValidator).singleton(),
  });

  // Instantiate and start the EventLoggerAdapter
  // that subscribes to all domain events and logs them.
  const eventBus = container.resolve<EventBus>('eventBus');
  const logger = container.resolve<ConsoleLogger>('logger');

  const eventLogger = new EventLoggerAdapter(eventBus, logger);
  eventLogger.start();
}
