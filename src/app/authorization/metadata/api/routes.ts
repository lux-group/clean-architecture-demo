import { AwilixContainer } from "awilix"
import express from "express"
import { MetadataController } from "./MetadataController"

export function registerMetadataRoutes(container: AwilixContainer) {
  const metadataController = container.resolve<MetadataController>("metadataController")

  return express.Router()
    .get("/openid-configuration", metadataController.getOpenidConfiguration.bind(metadataController))
    .get("/jwks", metadataController.getJwks.bind(metadataController))
}
