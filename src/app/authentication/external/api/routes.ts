import { AwilixContainer } from "awilix"
import express from "express"
import { ExternalAuthenticationController } from "./ExternalAuthenticationController"

export function registerExternalAuthenticationRoutes(container: AwilixContainer) {
  const externalAuthenticationController = container.resolve<ExternalAuthenticationController>("externalAuthenticationController")

  return express.Router()
    .get("/sign-in", externalAuthenticationController.createSignInRequest.bind(externalAuthenticationController))
    .get("/sign-out", externalAuthenticationController.createSignOutRequest.bind(externalAuthenticationController))
    .get("/sign-in-callback", externalAuthenticationController.processSignInResponse.bind(externalAuthenticationController))
    .get("/sign-out-callback", externalAuthenticationController.processSignOutResponse.bind(externalAuthenticationController))
    .get("/frontchannel-sign-out", externalAuthenticationController.frontChannelSignOut.bind(externalAuthenticationController))
}
