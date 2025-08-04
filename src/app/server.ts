import { AwilixContainer } from "awilix"
import express from "express"
import cookieParser from "cookie-parser"
import helmet, { HelmetOptions } from "helmet"

import { registerIdentityProviderAdminRoutes } from "~/app/admin/identity-provider/api/routes"
import { registerSessionAdminRoutes } from "~/app/admin/session/api/routes"
import { registerSigningKeysAdminRoutes } from "~/app/admin/signing-key/api/routes"
import { registerUserAdminRoutes } from "~/app/admin/user/api/routes"
import { registerExternalAuthenticationRoutes } from "~/app/authentication/external/api/routes"
import { registerLocalAuthenticationRoutes } from "~/app/authentication/local/api/routes"
import { registerWellKnownRoutes } from "~/app/authorization/well-known/api/routes"
import { registerTokenRoutes } from "~/app/authorization/token/api/routes"
import { registerEntraIntegrationRoutes } from "~/app/integration/entra/api/routes"

export default function createServer(container: AwilixContainer) {
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
    .use("/admin/identity-providers", registerIdentityProviderAdminRoutes(container))
    .use("/admin/sessions", registerSessionAdminRoutes(container))
    .use("/admin/signing-keys", registerSigningKeysAdminRoutes(container))
    .use("/admin/users", registerUserAdminRoutes(container))
    .use("/auth/external", registerExternalAuthenticationRoutes(container))
    .use("/auth/local", registerLocalAuthenticationRoutes(container))
    .use("/oauth2/.well-known", registerWellKnownRoutes(container))
    .use("/oauth2/token", registerTokenRoutes(container))
    .use("/integration/entra", registerEntraIntegrationRoutes(container))

    .use(container.resolve("handleClientErrors"))
    .use(container.resolve("handleServerErrors"))
}
