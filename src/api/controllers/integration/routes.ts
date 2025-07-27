import { AwilixContainer } from "awilix"
import express from "express"

import { EntraExtensionController } from "./EntraExtensionController"

export function registerIntegrationRoutes(container: AwilixContainer) {
  const entraExtensionController = container.resolve<EntraExtensionController>("entraExtensionController")

  return express.Router()
    .post("/entra/attribute-collection-start", entraExtensionController.onAttributeCollectionStart.bind(entraExtensionController))
    .post("/entra/attribute-collection-submit", entraExtensionController.onAttributeCollectionSubmit.bind(entraExtensionController))
    .post("/entra/token-issuance-start", entraExtensionController.onTokenIssuanceStart.bind(entraExtensionController))
}
