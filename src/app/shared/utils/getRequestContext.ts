import { AsyncLocalStorage } from "node:async_hooks"

export interface RequestContext {
  requestId: string
  ipAddress?: string
  userAgent?: string
  jwtClaims?: Record<string, unknown>
}

export const contextStorage = new AsyncLocalStorage<RequestContext>()

export const getRequestContext = (): RequestContext | undefined => {
  return contextStorage.getStore()
}
