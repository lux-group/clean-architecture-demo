import { AwilixContainer } from "awilix"
import express from "express"
import cookieParser from "cookie-parser"
import helmet, { HelmetOptions } from "helmet"

import { Logger } from "~/infrastructure/logging"

import { handleServerErrors } from "./middleware/handleServerErrors"
import { registerAdminRoutes } from "./controllers/admin/routes"
import { registerAuthenticationRoutes } from "./controllers/authentication/routes"
import { registerAuthorizationRoutes } from "./controllers/authorization/routes"
import { registerIntegrationRoutes } from "./controllers/integration/routes"

export default function createServer(container: AwilixContainer) {
  const logger = container.resolve<Logger>("logger")

  const helmetOptions: HelmetOptions = {
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": ["'self'", "'unsafe-inline'"] // Only required for demo page; not recommended for production
      }
    },
  }

  return express()
    .use(helmet(helmetOptions))
    .use(cookieParser())
    .use(express.json())
    
    .use("/", express.static(__dirname + "/public"))
    .use("/admin", registerAdminRoutes(container))
    .use("/auth", registerAuthenticationRoutes(container))
    .use("/oauth2", registerAuthorizationRoutes(container))
    .use("/integration", registerIntegrationRoutes(container))

    .use(handleServerErrors(logger))
}
