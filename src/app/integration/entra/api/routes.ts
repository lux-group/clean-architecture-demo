import { AwilixContainer } from "awilix"
import express from "express"

import { EntraExtensionController } from "./EntraExtensionController"

export function registerEntraIntegrationRoutes(container: AwilixContainer) {
  const entraExtensionController = container.resolve<EntraExtensionController>("entraExtensionController")

  return express.Router()
    .post("/attribute-collection-start", entraExtensionController.onAttributeCollectionStart.bind(entraExtensionController))
    .post("/attribute-collection-submit", entraExtensionController.onAttributeCollectionSubmit.bind(entraExtensionController))
    .post("/token-issuance-start", entraExtensionController.onTokenIssuanceStart.bind(entraExtensionController))
}
