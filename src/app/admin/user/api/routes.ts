import { AwilixContainer } from "awilix"
import express from "express"
import { authorize } from "~/app/shared/middleware/authorize"
import { UserController } from "./UserController"

export function registerUserAdminRoutes(container: AwilixContainer) {
  const userController = container.resolve<UserController>("userController")

  return express.Router()
    .get("/", authorize("users:read"), userController.getAll.bind(userController))
    .get("/:id", authorize("users:read"), userController.getById.bind(userController))
    .post("", authorize("users:write"), userController.create.bind(userController))
    .put("/:id", authorize("users:write"), userController.update.bind(userController))
    .delete("/:id", authorize("users:write"), userController.delete.bind(userController))
}
