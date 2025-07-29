import { AwilixContainer } from "awilix"
import express from "express"
import { authorize } from "~/app/shared/middleware/authorize"
import { SigningKeyController } from "./SigningKeyController"

export function registerSigningKeysAdminRoutes(container: AwilixContainer) {
  const signingKeyController = container.resolve<SigningKeyController>("signingKeyController")

  return express.Router()
    .get("/", authorize("signing-keys:read"), signingKeyController.getAll.bind(signingKeyController))
    .get("/:id", authorize("signing-keys:read"), signingKeyController.getById.bind(signingKeyController))
    .post("/", authorize("signing-keys:write"), signingKeyController.create.bind(signingKeyController))
    .delete("/:id", authorize("signing-keys:write"), signingKeyController.delete.bind(signingKeyController))
}
