import { AwilixContainer } from "awilix"
import express from "express"
import { LocalAuthenticationController } from "./LocalAuthenticationController"

export function registerLocalAuthenticationRoutes(container: AwilixContainer) {
  const localAuthenticationController = container.resolve<LocalAuthenticationController>("localAuthenticationController")

  return express.Router()
    .post("/sign-in", localAuthenticationController.signInWithPassword.bind(localAuthenticationController))
    .post("/sign-out", localAuthenticationController.signOut.bind(localAuthenticationController))
}
