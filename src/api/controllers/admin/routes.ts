import { AwilixContainer } from "awilix"
import express from "express"
import { Logger } from "~/infrastructure/logging"

import { authorize } from "~/api/middleware/authorize"
import { handleClientErrors } from "../../middleware/handleClientErrors"
import { IdentityProviderController } from "./IdentityProviderController"
import { SessionController } from "./SessionController"
import { SigningKeyController } from "./SigningKeyController"
import { UserController } from "./UserController"

export function registerAdminRoutes(container: AwilixContainer) {
  const identityProviderController = container.resolve<IdentityProviderController>("identityProviderController")
  const sessionController = container.resolve<SessionController>("sessionController")
  const signingKeyController = container.resolve<SigningKeyController>("signingKeyController")
  const userController = container.resolve<UserController>("userController")
  const logger = container.resolve<Logger>("logger")

  return express.Router()
    .get("/identity-providers", authorize("identity-providers:read"), identityProviderController.getAll.bind(identityProviderController))
    .get("/identity-providers/:id", authorize("identity-providers:read"), identityProviderController.getById.bind(identityProviderController))
    .post("/identity-providers", authorize("identity-providers:write"), identityProviderController.create.bind(identityProviderController))
    .put("/identity-providers/:id", authorize("identity-providers:write"), identityProviderController.update.bind(identityProviderController))
    .delete("/identity-providers/:id", authorize("identity-providers:write"), identityProviderController.delete.bind(identityProviderController))

    .get("/sessions", authorize("sessions:read"), sessionController.getAll.bind(sessionController))
    .get("/sessions/:id", authorize("sessions:read"), sessionController.getById.bind(sessionController))
    .post("/sessions/:id/terminate", authorize("sessions:write"), sessionController.terminate.bind(sessionController))

    .get("/signing-keys", authorize("signing-keys:read"), signingKeyController.getAll.bind(signingKeyController))
    .get("/signing-keys/:id", authorize("signing-keys:read"), signingKeyController.getById.bind(signingKeyController))
    .post("/signing-keys", authorize("signing-keys:write"), signingKeyController.create.bind(signingKeyController))
    .delete("/signing-keys/:id", authorize("signing-keys:write"), signingKeyController.delete.bind(signingKeyController))

    .get("/users", authorize("users:read"), userController.getAll.bind(userController))
    .get("/users/:id", authorize("users:read"), userController.getById.bind(userController))
    .post("/users", authorize("users:write"), userController.create.bind(userController))
    .put("/users/:id", authorize("users:write"), userController.update.bind(userController))
    .delete("/users/:id", authorize("users:write"), userController.delete.bind(userController))

    .use(handleClientErrors(logger))
}
