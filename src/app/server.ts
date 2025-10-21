import { router as buildRouter, RouterOptions } from "@luxuryescapes/router"
import { AwilixContainer } from "awilix"
import cookieParser from "cookie-parser"
import express from "express"
import helmet, { HelmetOptions } from "helmet"
import { mountRoutesFromDecorators } from "./routing"

export default function createServer(container: AwilixContainer) {
  const baseUrl = container.resolve("baseUrl")

  const helmetOptions: HelmetOptions = {
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": ["'self'", "'unsafe-inline'"], // Only required for demo page; not recommended for production
      },
    },
  }

  const routerOptions: RouterOptions = {
    swaggerBaseProperties: {
      info: {
        title: "Clean Architecture Demo",
        description: "Clean Architecture Demo",
        version: "1.0.0",
        contact: { email: "pascal.enz@luxuryescapes.com" },
      },
      servers: [
        {
          url: baseUrl,
          description: "default",
          variables: {},
        },
      ],
    },
  }

  const app = express()
    .use(helmet(helmetOptions))
    .use(cookieParser())
    .use(express.json({ limit: "100kb" }))
    .use(express.urlencoded({ limit: "100kb" }))
    .use("/", express.static(`${__dirname}/public`))

  const router = buildRouter(app, routerOptions)
  router.serveSwagger(`/docs`)
  mountRoutesFromDecorators(router, container)

  return app.use(container.resolve("handleServerErrors"))
}
