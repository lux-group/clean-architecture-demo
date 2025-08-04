import { AwilixContainer } from "awilix"
import express from "express"
import cookieParser from "cookie-parser"
import helmet, { HelmetOptions } from "helmet"
import { registerRoutesFromDecorators } from "./decorators"

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
    .use(express.urlencoded())
    .use("/", express.static(__dirname + "/public"))
    .use(registerRoutesFromDecorators(container))
    .use(container.resolve("handleClientErrors"))
    .use(container.resolve("handleServerErrors"))
}
