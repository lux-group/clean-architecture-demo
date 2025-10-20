import { router as buildRouter, JSONSchema, RouterOptions, Schema, SchemaValidationError } from "@luxuryescapes/router"
import { AwilixContainer } from "awilix"
import cookieParser from "cookie-parser"
import express from "express"
import helmet, { HelmetOptions } from "helmet"
import z, { ZodType } from "zod"
import { mountRoutesFromDecorators } from "./routing"

const schemaValidator = (schema: Schema, data: unknown): SchemaValidationError[] => {
  const result = (schema as ZodType).safeParse(data)
  return result.success
    ? []
    : result.error.issues.map(issue => ({
        message: issue.message,
        path: issue.path.join("."),
        value: undefined!,
      }))
}

const jsonSchemaGenerator = (schema: Schema): JSONSchema => {
  return z.toJSONSchema(schema as ZodType, { target: "openapi-3.0" })
}

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
    schemaValidator,
    jsonSchemaGenerator,
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
