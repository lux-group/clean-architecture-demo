import "reflect-metadata"
import { RouteOptions, RouterAbstraction } from "@luxuryescapes/router"
import { AwilixContainer } from "awilix"
import { ErrorRequestHandler, Handler, RequestHandler } from "express"
import { ZodType } from "zod"
import { AuthorizeOptions } from "./shared/middleware/authorize"
import { ErrorHandlerOptions } from "./shared/middleware/handleDomainErrors"

export interface SchemaOptions {
  query?: ZodType
  params?: ZodType
  requestBody?: ZodType
  responseBody?: ZodType
}

enum MetadataKeys {
  BASE_PATH = "base_path",
  ROUTES = "routes",
  MIDDLEWARE = "middleware",
}

interface Route {
  propertyKey: string
  method: string
  path: string
  schema?: SchemaOptions
  preHandlers?: RequestHandler[]
  postHandlers?: RequestHandler[]
}

interface Middleware {
  propertyKey?: string
  identifier: string
  args: unknown[]
  isErrorHandler: boolean
}

function getMetadataArray<T>(key: MetadataKeys, target: any): T[] {
  return (Reflect.getMetadata(key, target) as T[] | undefined) ?? []
}

function middlewareDecoratorFactory<TArgs extends unknown[] = []>(identifier: string, isErrorHandler: boolean) {
  return (...args: TArgs) =>
    (target: any, propertyKey?: string | symbol) => {
      if (propertyKey) {
        // Route-scoped middleware
        const info: Middleware = { propertyKey: String(propertyKey), identifier, args, isErrorHandler }
        const items: Middleware[] = getMetadataArray<Middleware>(MetadataKeys.MIDDLEWARE, target.constructor)
        Reflect.defineMetadata(MetadataKeys.MIDDLEWARE, [...items, info], target.constructor)
      } else {
        // Controller-scoped middleware
        const info: Middleware = { identifier, args, isErrorHandler }
        const items: Middleware[] = getMetadataArray<Middleware>(MetadataKeys.MIDDLEWARE, target)
        Reflect.defineMetadata(MetadataKeys.MIDDLEWARE, [...items, info], target)
      }
    }
}

function routeDecoratorFactory(method: string) {
  return (path: string) => (target: any, propertyKey: string | symbol) => {
    const info: Route = { propertyKey: String(propertyKey), method, path }
    const items: Route[] = getMetadataArray<Route>(MetadataKeys.ROUTES, target.constructor)
    Reflect.defineMetadata(MetadataKeys.ROUTES, [...items, info], target.constructor)
  }
}

export function Controller(basePath: string) {
  return (target: any) => {
    Reflect.defineMetadata(MetadataKeys.BASE_PATH, basePath, target)
  }
}

export const Schema = (options: SchemaOptions) => {
  return (target: any, propertyKey: string | symbol) => {
    const items: Route[] = getMetadataArray<Route>(MetadataKeys.ROUTES, target.constructor)
    const route = items.find(item => item.propertyKey === String(propertyKey))
    if (route) {
      route.schema = options
    }
    Reflect.defineMetadata(MetadataKeys.ROUTES, items, target.constructor)
  }
}

export const Get = routeDecoratorFactory("get")
export const Delete = routeDecoratorFactory("delete")
export const Head = routeDecoratorFactory("head")
export const Options = routeDecoratorFactory("options")
export const Patch = routeDecoratorFactory("patch")
export const Post = routeDecoratorFactory("post")
export const Put = routeDecoratorFactory("put")

export const Authorize = middlewareDecoratorFactory<[AuthorizeOptions?]>("authorize", false)
export const HandleDomainErrors = middlewareDecoratorFactory<[ErrorHandlerOptions]>("handleDomainErrors", true)

export function mountRoutesFromDecorators(router: RouterAbstraction, container: AwilixContainer): void {
  // Get all the controllers from the container.
  // We use a simple naming convention to identify them.
  const controllers = Object.keys(container.registrations)
    .filter(key => key.endsWith("Controller"))
    .map(key => container.resolve(key))

  for (const controller of controllers) {
    // Get all the metadata for the controller.
    const basePath: string = Reflect.getMetadata(MetadataKeys.BASE_PATH, controller.constructor)
    const routes: Route[] = getMetadataArray<Route>(MetadataKeys.ROUTES, controller.constructor)
    const middleware: Middleware[] = getMetadataArray<Middleware>(MetadataKeys.MIDDLEWARE, controller.constructor)

    // Instantiate all middleware and error handlers for the controller.
    const controllerMiddleware: Handler[] = []
    const controllerErrorHandlers: ErrorRequestHandler[] = []
    const routeMiddleware: Record<string, Handler[]> = {}
    const routeErrorHandlers: Record<string, ErrorRequestHandler[]> = {}

    for (const { propertyKey, identifier, args, isErrorHandler } of middleware) {
      if (propertyKey) {
        const collection = isErrorHandler ? routeErrorHandlers : routeMiddleware
        collection[propertyKey] = collection[propertyKey] ?? []
        collection[propertyKey].push(container.resolve(identifier)(...args))
      } else {
        const collection = isErrorHandler ? controllerErrorHandlers : controllerMiddleware
        collection.push(container.resolve(identifier)(...args))
      }
    }

    // Register all routes for the controller.
    const genericRouter = router as unknown as Record<string, (options: RouteOptions) => void>

    for (const route of routes) {
      const handler = controller[route.propertyKey].bind(controller)
      const preHandlers = [...(routeMiddleware[route.propertyKey] ?? []), ...controllerMiddleware]
      const handlers = [handler, ...(routeErrorHandlers[route.propertyKey] ?? []), ...controllerErrorHandlers]

      genericRouter[route.method]({
        operationId: route.propertyKey,
        isPublic: true,
        url: basePath + route.path,
        preHandlers,
        handlers,
        schema: {
          request: {
            query: route.schema?.query,
            params: route.schema?.params,
            body: route.schema?.requestBody,
          },
          responses: {
            "200": route.schema?.responseBody,
          },
        },
      })
    }
  }
}
