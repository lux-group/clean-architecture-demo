import { AwilixContainer } from "awilix"
import express from "express"
import { TokenController } from "./TokenController"

export function registerTokenRoutes(container: AwilixContainer) {
  const tokenController = container.resolve<TokenController>("tokenController")
  const handleOAuthErrors = container.resolve("handleOAuthErrors")

  return express.Router()
    .use(express.urlencoded())
    .post("/", tokenController.getAccessToken.bind(tokenController))
    .use(handleOAuthErrors)
}
