import { AwilixContainer } from "awilix"
import express from "express"
import { authorize } from "~/app/shared/middleware/authorize"
import { IdentityProviderController } from "./IdentityProviderController"

export function registerIdentityProviderAdminRoutes(container: AwilixContainer) {
  const identityProviderController = container.resolve<IdentityProviderController>("identityProviderController")

  return express.Router()
    .get("/", authorize("identity-providers:read"), identityProviderController.getAll.bind(identityProviderController))
    .get("/:id", authorize("identity-providers:read"), identityProviderController.getById.bind(identityProviderController))
    .post("/", authorize("identity-providers:write"), identityProviderController.create.bind(identityProviderController))
    .put("/:id", authorize("identity-providers:write"), identityProviderController.update.bind(identityProviderController))
    .delete("/:id", authorize("identity-providers:write"), identityProviderController.delete.bind(identityProviderController))
}
