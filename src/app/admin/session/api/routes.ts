import { AwilixContainer } from "awilix"
import express from "express"
import { authorize } from "~/app/shared/middleware/authorize"
import { SessionController } from "./SessionController"

export function registerSessionAdminRoutes(container: AwilixContainer) {
  const sessionController = container.resolve<SessionController>("sessionController")
  return express.Router()
    .get("/", authorize("sessions:read"), sessionController.getAll.bind(sessionController))
    .get("/:id", authorize("sessions:read"), sessionController.getById.bind(sessionController))
    .post("/:id/terminate", authorize("sessions:write"), sessionController.terminate.bind(sessionController))
}
