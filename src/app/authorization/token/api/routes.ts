import { AwilixContainer } from "awilix"
import express from "express"
import { Logger } from "~/infrastructure/logging"

import { handleOAuthErrors } from "./handleOAuthErrors"
import { TokenController } from "./TokenController"

export function registerTokenRoutes(container: AwilixContainer) {
  const tokenController = container.resolve<TokenController>("tokenController")
  const logger = container.resolve<Logger>("logger")

  return express.Router()
    .use(express.urlencoded())
    .post("/", tokenController.getAccessToken.bind(tokenController))
    .use(handleOAuthErrors(logger))
}
