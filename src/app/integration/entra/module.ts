import { asClass, AwilixContainer } from "awilix"
import { EntraExtensionController } from "./api/EntraExtensionController"

export default function registerEntraIntegrationModule(container: AwilixContainer) {
  container.register({
    entraExtensionController: asClass(EntraExtensionController).singleton(),
  })
}
