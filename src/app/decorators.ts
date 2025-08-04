import "reflect-metadata"
import express, { Handler, Router } from "express"
import { AwilixContainer } from "awilix"
import { AuthorizeOptions } from "./shared/middleware/authorize"

enum MetadataKeys {
  BASE_PATH = "base_path",
  ROUTES = "routes",
  MIDDLEWARE = "middleware",
}

interface RouterInfo {
  propertyKey: string | symbol
  method: string
  path: string
}

interface MiddlewareInfo {
  propertyKey: string | symbol
  identifier: string
  args: unknown[]
}

function defineMethodMetadata<T extends object>(target: any, name: string, data: T) {
  const items: T[] = Reflect.getMetadata(name, target.constructor) || []
  items.push(data)
  Reflect.defineMetadata(name, items, target.constructor)
}

function routeDecoratorFactory(method: string) {
  return function (path: string) {
    return function (target: any, propertyKey: string | symbol) {
      defineMethodMetadata<RouterInfo>(target, MetadataKeys.ROUTES, { propertyKey, method, path })
    }
  }
}

function registerMiddleware(target: any, propertyKey: string | symbol, identifier: string, args: unknown[] = []) {
  defineMethodMetadata<MiddlewareInfo>(target, MetadataKeys.MIDDLEWARE, { propertyKey, identifier, args })
}

export const Get = routeDecoratorFactory("get")
export const Delete = routeDecoratorFactory("delete")
export const Head = routeDecoratorFactory("head")
export const Options = routeDecoratorFactory("options")
export const Patch = routeDecoratorFactory("patch")
export const Post = routeDecoratorFactory("post")
export const Put = routeDecoratorFactory("put")

export function Controller(basePath: string) {
  return function (target: any) {
    Reflect.defineMetadata(MetadataKeys.BASE_PATH, basePath, target.prototype)
  }
}

export function Authorize(options: AuthorizeOptions) {
  return function (target: any, propertyKey: string | symbol) {
    registerMiddleware(target, propertyKey, "authorize", [options])
  }
}

export function OAuthErrors() {
  return function (target: any, propertyKey: string | symbol) {
    registerMiddleware(target, propertyKey, "handleOAuthErrors", [])
  }
}

export function registerRoutesFromDecorators(container: AwilixContainer): Router {
  const controllers = Object.keys(container.registrations)
    .filter(key => key.endsWith("Controller"))
    .map(key => container.resolve(key))

  const router = express.Router()

  for (const controller of controllers) {
    const basePath: string = Reflect.getMetadata(MetadataKeys.BASE_PATH, controller.constructor.prototype)
    const routeInfos: RouterInfo[] = Reflect.getMetadata(MetadataKeys.ROUTES, controller.constructor) || []
    const middlewareInfos: MiddlewareInfo[] = Reflect.getMetadata(MetadataKeys.MIDDLEWARE, controller.constructor) || []

    const middleware: Record<string, Handler[]> = {}

    for (const { propertyKey, identifier, args } of middlewareInfos) {
      const propertyName = String(propertyKey)
      middleware[propertyName] = middleware[propertyName] ?? []
      middleware[propertyName].push(container.resolve(identifier)(args));
    }

    for (const { propertyKey, method, path } of routeInfos) {
      const propertyName = String(propertyKey)
      const routeMiddleware = middleware[propertyName] || []
      router[method](basePath + path, ...routeMiddleware, controller[propertyName].bind(controller))
    }
  }

  return router
}
