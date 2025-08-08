import "reflect-metadata"
import express, { Handler, ErrorRequestHandler, Router } from "express"
import { AwilixContainer } from "awilix"
import { AuthorizeOptions } from "./shared/middleware/authorize"

enum MetadataKeys {
  BASE_PATH = "base_path",
  ROUTES = "routes",
  MIDDLEWARE = "middleware",
}

interface Route {
  propertyKey: string | symbol
  method: string
  path: string
}

interface Middleware {
  propertyKey: string | symbol
  identifier: string
  args: unknown[]
  isErrorHandler: boolean
}

function routeDecoratorFactory(method: string) {
  return function (path: string) {
    return function (target: any, propertyKey: string | symbol) {
      const info: Route = { propertyKey, method, path }
      const items: Route[] = Reflect.getMetadata(MetadataKeys.ROUTES, target.constructor) || []
      Reflect.defineMetadata(MetadataKeys.ROUTES, [...items, info], target.constructor)
    }
  }
}

function routeMiddlewareDecoratorFactory<T>(identifier: string, isErrorHandler: boolean) {
  return function (options: T) {
    return function (target: any, propertyKey: string | symbol) {
      const info: Middleware = { propertyKey, identifier, args: [options] as unknown[], isErrorHandler }
      const items: Middleware[] = Reflect.getMetadata(MetadataKeys.MIDDLEWARE, target.constructor) || []
      Reflect.defineMetadata(MetadataKeys.MIDDLEWARE, [...items, info], target.constructor)
    }
  }
}

export function Controller(basePath: string) {
  return function (target: any) {
    Reflect.defineMetadata(MetadataKeys.BASE_PATH, basePath, target)
  }
}

export const Get = routeDecoratorFactory("get")
export const Delete = routeDecoratorFactory("delete")
export const Head = routeDecoratorFactory("head")
export const Options = routeDecoratorFactory("options")
export const Patch = routeDecoratorFactory("patch")
export const Post = routeDecoratorFactory("post")
export const Put = routeDecoratorFactory("put")

export const Authorize = routeMiddlewareDecoratorFactory<AuthorizeOptions>("authorize", false)
export const HandleOAuthErrors = routeMiddlewareDecoratorFactory<void>("handleOAuthErrors", true)

export function createRouterFromDecorators(container: AwilixContainer): Router {
  // Get all the controllers from the container.
  // We use a simple naming convention to identify them.
  const controllers = Object.keys(container.registrations)
    .filter(key => key.endsWith("Controller"))
    .map(key => container.resolve(key))

  const router = express.Router()

  for (const controller of controllers) {
    // Get all the metadata for the controller.
    const basePath: string = Reflect.getMetadata(MetadataKeys.BASE_PATH, controller.constructor)
    const routeInfos: Route[] = Reflect.getMetadata(MetadataKeys.ROUTES, controller.constructor)!
    const middlewareInfos: Middleware[] = Reflect.getMetadata(MetadataKeys.MIDDLEWARE, controller.constructor) || []

    // Instantiate all middleware and error handlers for the controller.
    const middleware: Record<string, Handler[]> = {}
    const errorHandlers: Record<string, ErrorRequestHandler[]> = {}

    for (const { propertyKey, identifier, args, isErrorHandler } of middlewareInfos) {
      const propertyName = String(propertyKey)
      const collection = isErrorHandler ? errorHandlers : middleware
      collection[propertyName] = collection[propertyName] ?? []
      collection[propertyName].push(container.resolve(identifier)(...args))
    }

    // Register all routes for the controller.
    for (const { propertyKey, method, path } of routeInfos) {
      const propertyName = String(propertyKey)
      const routeMiddleware = middleware[propertyName] || []
      const routeErrorHandlers = errorHandlers[propertyName] || []
      router[method](basePath + path, ...routeMiddleware, controller[propertyName].bind(controller), ...routeErrorHandlers)
    }
  }

  return router
}
