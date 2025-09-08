import { randomUUID } from "node:crypto"
import { describe, expect, it, vi } from "vitest"
import { AuthenticationService } from "./AuthenticationService"
import { AuthenticationError } from "../errors"
import { createIdentityProvider, createLocalSession, createUser } from "@test/factories"

describe("AuthenticationService", () => {
  const service = new AuthenticationService()

  describe("authenticateWithActiveSession", () => {
    it("returns user when session is active and matches user", () => {
      const user = createUser()
      const session = createLocalSession({ userId: user.id }, 1)

      const result = service.authenticateWithActiveSession(user, session)
      expect(result).toBe(user)
    })

    it("throws when user is unauthenticated (undefined)", () => {
      const session = createLocalSession()
      expect(() => service.authenticateWithActiveSession(undefined, session)).toThrow(AuthenticationError)
    })

    it("throws when user is disabled", () => {
      const user = createUser({ isEnabled: false })
      const session = createLocalSession({ userId: user.id })
      expect(() => service.authenticateWithActiveSession(user, session)).toThrow(AuthenticationError)
    })

    it("returns when user is a service account", () => {
      const user = createUser({ roles: ["service"] })
      const session = createLocalSession({ userId: user.id })
      expect(() => service.authenticateWithActiveSession(user, session)).toThrow(AuthenticationError)
    })

    it("throws when session is inactive", () => {
      const user = createUser()
      const session = createLocalSession({ userId: user.id }, -1) // expired
      expect(() => service.authenticateWithActiveSession(user, session)).toThrow(AuthenticationError)
    })

    it("throws when session belongs to another user", () => {
      const user = createUser()
      const other = createUser()
      const session = createLocalSession({ userId: other.id })
      expect(() => service.authenticateWithActiveSession(user, session)).toThrowError()
    })
  })

  describe("authenticateWithPassword", () => {
    const okVerify = vi.fn(() => true)
    const badVerify = vi.fn(() => false)

    it("returns user when password verifies", () => {
      const user = createUser({ passwordHash: "hash" })
      const result = service.authenticateWithPassword(user, "pw", okVerify)
      expect(result).toBe(user)
      expect(okVerify).toHaveBeenCalled()
    })

    it("throws when user is unauthenticated (undefined)", () => {
      expect(() => service.authenticateWithPassword(undefined, "pw", okVerify)).toThrow(AuthenticationError)
    })

    it("returns when user is a service account", () => {
      const user = createUser({ roles: ["service"] })
      const session = createLocalSession({ userId: user.id })
      expect(() => service.authenticateWithPassword(user, "pw", okVerify)).toThrow(AuthenticationError)
    })

    it("throws when account has external identities", () => {
      const user = createUser({ passwordHash: "hash" })
      user.addIdentity(randomUUID(), "x")
      expect(() => service.authenticateWithPassword(user, "pw", okVerify)).toThrow(AuthenticationError)
    })

    it("throws and calls handleFailedSignInAttempt on invalid password", () => {
      const user = createUser({ passwordHash: "hash" })
      const spy = vi.spyOn(user, "handleFailedSignInAttempt")
      expect(() => service.authenticateWithPassword(user, "bad", badVerify)).toThrow(AuthenticationError)
      expect(spy).toHaveBeenCalled()
    })
  })

  describe("authenticateWithClientSecret", () => {
    const okVerify = vi.fn(() => true)
    const badVerify = vi.fn(() => false)

    it("returns service user when secret verifies", () => {
      const user = createUser({ passwordHash: "hash", roles: ["service"] })
      const result = service.authenticateWithClientSecret(user, "secret", okVerify)
      expect(result).toBe(user)
    })

    it("throws when user is not a service account", () => {
      const user = createUser({ passwordHash: "hash", roles: [] })
      expect(() => service.authenticateWithClientSecret(user, "secret", okVerify)).toThrow(AuthenticationError)
    })

    it("throws and calls handleFailedSignInAttempt on invalid secret", () => {
      const user = createUser({ passwordHash: "hash", roles: ["service"] })
      const spy = vi.spyOn(user, "handleFailedSignInAttempt")
      expect(() => service.authenticateWithClientSecret(user, "bad", badVerify)).toThrow(AuthenticationError)
      expect(spy).toHaveBeenCalled()
    })
  })

  describe("authenticateWithIdentityProvider", () => {
    it("returns user when identity matches", () => {
      const idp = createIdentityProvider()
      const user = createUser()
      user.addIdentity(idp.id, "abc")
      const result = service.authenticateWithIdentityProvider(user, idp, "abc")
      expect(result).toBe(user)
    })

    it("throws when identity not found", () => {
      const idp = createIdentityProvider()
      const user = createUser()
      expect(() => service.authenticateWithIdentityProvider(user, idp, "nope")).toThrow(AuthenticationError)
    })
  })

  describe("authenticateWithExternalToken", () => {
    it("returns service user when identity matches", () => {
      const idp = createIdentityProvider()
      const user = createUser({ roles: ["service"] })
      user.addIdentity(idp.id, "abc")
      const result = service.authenticateWithExternalToken(user, idp, "abc")
      expect(result).toBe(user)
    })

    it("throws when user is not a service account", () => {
      const idp = createIdentityProvider()
      const user = createUser({ roles: [] })
      expect(() => service.authenticateWithExternalToken(user, idp, "abc")).toThrow(AuthenticationError)
    })
  })
})


