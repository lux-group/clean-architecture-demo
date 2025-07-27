import { AwilixContainer } from "awilix"
import express from "express"
import { Logger } from "~/infrastructure/logging"

import { handleOAuthErrors } from "../../middleware/handleOAuthErrors"
import { MetadataController } from "./MetadataController"
import { TokenController } from "./TokenController"

export function registerAuthorizationRoutes(container: AwilixContainer) {
  const metadataController = container.resolve<MetadataController>("metadataController")
  const tokenController = container.resolve<TokenController>("tokenController")
  const logger = container.resolve<Logger>("logger")

  return express.Router()
    .use(express.urlencoded())

    .get("/.well-known/openid-configuration", metadataController.getOpenidConfiguration.bind(metadataController))
    .get("/.well-known/jwks", metadataController.getJwks.bind(metadataController))
    .post("/token", tokenController.getAccessToken.bind(tokenController))

    .use(handleOAuthErrors(logger))
}
