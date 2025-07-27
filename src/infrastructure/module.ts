import { asClass, AwilixContainer } from "awilix"
import { ClientFactory } from "./auth/ClientFactory"
import { NodeEncryptionProvider } from "./crypto/NodeEncryptionProvider"
import { NodeKeyPairGenerator } from "./crypto/NodeKeyPairGenerator"
import { ConsoleLogger } from "./logging/ConsoleLogger"
import registerDomainAdapters from "./adapters/module"

export default function registerInfrastructureServices(container: AwilixContainer) {
  container.register({
    authClientFactory: asClass(ClientFactory).singleton(),
    logger: asClass(ConsoleLogger).singleton(),
    encryptionProvider: asClass(NodeEncryptionProvider).singleton(),
    keyPairGenerator: asClass(NodeKeyPairGenerator).singleton(),
  })

  registerDomainAdapters(container)
}
