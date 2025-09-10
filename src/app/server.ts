import { AwilixContainer } from "awilix"
import cookieParser from "cookie-parser"
import express from "express"
import helmet, { HelmetOptions } from "helmet"
import { createRouterFromDecorators } from "./routing"

export default function createServer(container: AwilixContainer) {
  const helmetOptions: HelmetOptions = {
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": ["'self'", "'unsafe-inline'"], // Only required for demo page; not recommended for production
      },
    },
  }

  return express()
    .use(helmet(helmetOptions))
    .use(cookieParser())
    .use(express.json({ limit: "100kb" }))
    .use(express.urlencoded({ limit: "100kb" }))
    .use("/", express.static(`${__dirname}/public`))
    .use(container.resolve("setRequestContext"))
    .use(createRouterFromDecorators(container))
    .use(container.resolve("handleServerErrors"))
}
