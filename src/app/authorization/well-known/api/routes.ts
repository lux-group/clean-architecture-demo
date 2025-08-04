import { AwilixContainer } from "awilix"
import express from "express"
import { WellKnownController } from "./WellKnownController"

export function registerWellKnownRoutes(container: AwilixContainer) {
  const wellKnownController = container.resolve<WellKnownController>("wellKnownController")

  return express.Router()
    .get("/openid-configuration", wellKnownController.getOpenidConfiguration.bind(wellKnownController))
    .get("/jwks", wellKnownController.getJsonWebKeys.bind(wellKnownController))
}
