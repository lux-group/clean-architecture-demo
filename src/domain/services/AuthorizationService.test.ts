import { describe, expect, it } from "vitest"
import { AuthorizationService } from "./AuthorizationService"
import { AuthorizationError } from "../errors"
import { createUser } from "@test/factories"

describe("AuthorizationService", () => {
  const service = new AuthorizationService()

  it("allows employee to impersonate a user without roles", () => {
    const employee = createUser({ roles: ["employee"] })
    const target = createUser({ roles: [] })

    expect(() => service.authorizeImpersonation(employee, target)).not.toThrow()
  })

  it("disallows impersonating self", () => {
    const user = createUser({ roles: ["employee"] })
    expect(() => service.authorizeImpersonation(user, user)).toThrow(AuthorizationError)
  })

  it("disallows non-employee from impersonating", () => {
    const user = createUser({ roles: [] })
    const target = createUser({ roles: [] })
    expect(() => service.authorizeImpersonation(user, target)).toThrow(AuthorizationError)
  })

  it("disallows service accounts from impersonating", () => {
    const svc = createUser({ roles: ["service", "employee"] })
    const target = createUser({ roles: [] })
    expect(() => service.authorizeImpersonation(svc, target)).toThrow(AuthorizationError)
  })

  it("disallows impersonating service accounts", () => {
    const employee = createUser({ roles: ["employee"] })
    const svc = createUser({ roles: ["service"] })
    expect(() => service.authorizeImpersonation(employee, svc)).toThrow(AuthorizationError)
  })

  it("disallows impersonating users with roles", () => {
    const employee = createUser({ roles: ["employee"] })
    const target = createUser({ roles: ["user"] })
    expect(() => service.authorizeImpersonation(employee, target)).toThrow(AuthorizationError)
  })
})


