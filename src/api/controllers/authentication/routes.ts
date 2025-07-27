import { AwilixContainer } from "awilix"
import express from "express"
import { Logger } from "~/infrastructure/logging"

import { handleClientErrors } from "../../middleware/handleClientErrors"
import { LocalAuthenticationController } from "./LocalAuthenticationController"
import { ExternalAuthenticationController } from "./ExternalAuthenticationController"

export function registerAuthenticationRoutes(container: AwilixContainer) {
  const localAuthenticationController = container.resolve<LocalAuthenticationController>("localAuthenticationController")
  const externalAuthenticationController = container.resolve<ExternalAuthenticationController>("externalAuthenticationController")
  const logger = container.resolve<Logger>("logger")

  return express.Router()
    .post("/local/sign-in", localAuthenticationController.signInWithPassword.bind(localAuthenticationController))
    .post("/local/sign-out", localAuthenticationController.signOut.bind(localAuthenticationController))

    .get("/external/sign-in", externalAuthenticationController.createSignInRequest.bind(externalAuthenticationController))
    .get("/external/sign-out", externalAuthenticationController.createSignOutRequest.bind(externalAuthenticationController))
    .get("/external/sign-in-callback", externalAuthenticationController.processSignInResponse.bind(externalAuthenticationController))
    .get("/external/sign-out-callback", externalAuthenticationController.processSignOutResponse.bind(externalAuthenticationController))
    .get("/external/frontchannel-sign-out", externalAuthenticationController.frontChannelSignOut.bind(externalAuthenticationController))

    .use(handleClientErrors(logger))
}
