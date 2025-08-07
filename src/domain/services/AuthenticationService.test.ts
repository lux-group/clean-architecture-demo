import { beforeEach, describe, expect, it, vi } from "vitest"
import * as factories from "@test/factories"
import { mockEventPublisher, mockPasswordVerifier, mockTokenValidator, mockUserRepository } from "@test/mocks"
import { AuthenticationError, commonErrors } from "~/domain/errors"
import { AuthenticationEvent } from "~/domain/events"
import { AuthenticationService } from "./AuthenticationService"

const mockProfile = {
  identifierClaimValue: "external-id",
  email: "test@example.com",
  givenName: "John",
  surname: "Doe"
}

describe("AuthenticationService", () => {
  let service: AuthenticationService

  beforeEach(() => {
    service = new AuthenticationService(
      mockUserRepository,
      mockEventPublisher,
      mockPasswordVerifier,
      mockTokenValidator
    )
    vi.clearAllMocks()
  })

  describe("authenticateWithActiveSession", () => {
    it("should authenticate user with active session successfully", async () => {
      const user = factories.createUser()
      const session = factories.createLocalSession()
      mockUserRepository.tryGetById.mockResolvedValue(user)

      const result = await service.authenticateWithActiveSession(session)

      expect(result).toBe(user)
      expect(mockEventPublisher.publishEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: "Authentication",
          result: "Success"
        })
      )
    })

    it("should throw error when session is not active", async () => {
      const session = factories.createLocalSession()
      session.terminateSessionByAdmin()

      await expect(service.authenticateWithActiveSession(session))
        .rejects.toThrow(new AuthenticationError(commonErrors.sessionExpired))

      expect(mockEventPublisher.publishEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: "Authentication",
          result: "Failed",
          reason: commonErrors.sessionExpired
        })
      )
    })

    it("should throw error when user not found", async () => {
      const session = factories.createLocalSession()
      mockUserRepository.tryGetById.mockResolvedValue(undefined)

      await expect(service.authenticateWithActiveSession(session))
        .rejects.toThrow(new AuthenticationError(commonErrors.authenticationFailed))
    })

    it("should throw error when user cannot sign in with active session", async () => {
      const user = factories.createUser({ roles: ["service"] })
      const session = factories.createLocalSession()
      mockUserRepository.tryGetById.mockResolvedValue(user)

      await expect(service.authenticateWithActiveSession(session))
        .rejects.toThrow(new AuthenticationError(commonErrors.authenticationMethodNotAllowed))
    })
  })

  describe("authenticateWithEmailAndPassword", () => {
    it("should authenticate user with email and password successfully", async () => {
      const user = factories.createUser({ passwordHash: "hashed-password" })
      mockUserRepository.tryGetByBrandAndEmail.mockResolvedValue(user)
      mockPasswordVerifier.verifyPassword.mockReturnValue(true)

      const result = await service.authenticateWithEmailAndPassword(user.brand, user.email, "password")

      expect(result).toBe(user)
      expect(mockPasswordVerifier.verifyPassword).toHaveBeenCalledWith("password", user.passwordHash)
      expect(mockEventPublisher.publishEvent).toHaveBeenCalledWith(
        expect.objectContaining({ 
          topic: "Authentication",
          result: "Success" 
        })
      )
    })

    it("should throw error when user not found", async () => {
      mockUserRepository.tryGetByBrandAndEmail.mockResolvedValue(undefined)

      await expect(service.authenticateWithEmailAndPassword("test-brand", "test@example.com", "password"))
        .rejects.toThrow(new AuthenticationError(commonErrors.authenticationFailed))
    })

    it("should throw error when password verification fails", async () => {
      const user = factories.createUser()
      mockUserRepository.tryGetByBrandAndEmail.mockResolvedValue(user)
      mockPasswordVerifier.verifyPassword.mockReturnValue(false)

      await expect(service.authenticateWithEmailAndPassword(user.brand, user.email, "password"))
        .rejects.toThrow(new AuthenticationError(commonErrors.authenticationFailed))
    })

    it("should throw error when user cannot sign in with password", async () => {
      const user = factories.createUser( { roles: ["service"] })
      mockUserRepository.tryGetByBrandAndEmail.mockResolvedValue(user)

      await expect(service.authenticateWithEmailAndPassword(user.brand, user.email, "password"))
        .rejects.toThrow(new AuthenticationError(commonErrors.authenticationMethodNotAllowed))
    })
  })

  describe("authenticateWithClientCredentials", () => {
    it("should authenticate client with credentials successfully", async () => {
      const user = factories.createUser({ roles: ["service"], passwordHash: "hashed-client-secret" })
      mockUserRepository.tryGetById.mockResolvedValue(user)
      mockPasswordVerifier.verifyPassword.mockReturnValue(true)

      const result = await service.authenticateWithClientCredentials(user.id, "client-secret")

      expect(result).toBe(user)
      expect(mockPasswordVerifier.verifyPassword).toHaveBeenCalledWith("client-secret", user.passwordHash)
    })

    it("should throw error when client not found", async () => {
      mockUserRepository.tryGetById.mockResolvedValue(undefined)

      await expect(service.authenticateWithClientCredentials("client-id", "client-secret"))
        .rejects.toThrow(new AuthenticationError(commonErrors.authenticationFailed))
    })

    it("should throw error when client cannot use client credentials", async () => {
      const user = factories.createUser()
      mockUserRepository.tryGetById.mockResolvedValue(user)

      await expect(service.authenticateWithClientCredentials(user.id, "client-secret"))
        .rejects.toThrow(new AuthenticationError(commonErrors.authenticationMethodNotAllowed))
    })
  })

  describe("authenticateWithExternalIdentityToken", () => {
    it("should authenticate with external identity token successfully", async () => {
      const idp = factories.createIdentityProvider()
      const user = factories.createUser()
      user.addIdentity(idp.id, "external-id")

      mockTokenValidator.decodeAndValidateToken.mockResolvedValue({
        identityProvider: idp,
        profile: mockProfile
      })

      mockUserRepository.tryGetByExternalIdentity.mockResolvedValue(user)

      const result = await service.authenticateWithExternalIdentityToken("token")

      expect(result).toBe(user)
      expect(mockTokenValidator.decodeAndValidateToken).toHaveBeenCalledWith("token")
    })

    it("should throw error when token validation fails", async () => {
      mockTokenValidator.decodeAndValidateToken.mockRejectedValue(new Error("Invalid token"))

      await expect(service.authenticateWithExternalIdentityToken("invalid-token"))
        .rejects.toThrow(new AuthenticationError(commonErrors.authenticationFailed))

      expect(mockEventPublisher.publishEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: "Authentication",
          result: "Failed",
          reason: commonErrors.authenticationFailed
        })
      )
    })
  })

  describe("authenticateWithExternalIdentity", () => {
    it("should authenticate existing user with external identity", async () => {
      const idp = factories.createIdentityProvider()
      const user = factories.createUser({ roles: ["service"] })
      user.addIdentity(idp.id, "external-id")
      
      mockUserRepository.tryGetByExternalIdentity.mockResolvedValue(user)

      const result = await service.authenticateWithExternalIdentity(idp, mockProfile)

      expect(result.user).toBe(user)
      expect(result.newIdentity).toBeUndefined()
      expect(mockUserRepository.tryGetByExternalIdentity).toHaveBeenCalledWith(idp.id, "external-id")
    })

    it("should auto-link existing user when configured", async () => {
      const user = factories.createUser({ email: mockProfile.email })
      const idp = factories.createIdentityProvider({
        authSettings: {
          autoLinkUsers: true,
          autoCreateUsers: false
        }
      })

      mockUserRepository.tryGetByExternalIdentity.mockResolvedValue(undefined)
      mockUserRepository.tryGetByBrandAndEmail.mockResolvedValue(user)

      const result = await service.authenticateWithExternalIdentity(idp, mockProfile)

      expect(result.user).toBe(user)
      expect(result.newIdentity).toEqual(expect.objectContaining({
        identityProviderId: idp.id,
        identifierClaimValue: mockProfile.identifierClaimValue
      }))
      expect(mockUserRepository.update).toHaveBeenCalled()
    })

    it("should auto-create new user when configured", async () => {
      const idp = factories.createIdentityProvider({
        authSettings: {
          autoLinkUsers: false,
          autoCreateUsers: true
        }
      })

      mockUserRepository.tryGetByExternalIdentity.mockResolvedValue(undefined)
      mockUserRepository.tryGetByBrandAndEmail.mockResolvedValue(undefined)

      const result = await service.authenticateWithExternalIdentity(idp, mockProfile)

      expect(result.user).toEqual(expect.objectContaining({
        email: mockProfile.email,
        givenName: mockProfile.givenName,
        surname: mockProfile.surname, 
        identities: expect.arrayContaining([
          expect.objectContaining({
            identifierClaimValue: mockProfile.identifierClaimValue
          })
        ])
      }))
      expect(result.newIdentity).toEqual(expect.objectContaining({
        identityProviderId: idp.id,
        identifierClaimValue: mockProfile.identifierClaimValue
      }))
      expect(mockUserRepository.insert).toHaveBeenCalled()
    })

    it("should throw error when user not found and auto-creation disabled", async () => {
      const idp = factories.createIdentityProvider({
        authSettings: {
          autoLinkUsers: false,
          autoCreateUsers: false
        }
      })

      mockUserRepository.tryGetByExternalIdentity.mockResolvedValue(undefined)

      await expect(service.authenticateWithExternalIdentity(idp, mockProfile))
        .rejects.toThrow(new AuthenticationError(commonErrors.authenticationFailed))
    })

    it("should throw error when user cannot sign in with identity provider", async () => {
      const user = factories.createUser()
      const idp = factories.createIdentityProvider()

      mockUserRepository.tryGetByExternalIdentity.mockResolvedValue(user)

      await expect(service.authenticateWithExternalIdentity(idp, mockProfile))
        .rejects.toThrow(new AuthenticationError(commonErrors.authenticationMethodNotAllowed))
    })
  })
})

