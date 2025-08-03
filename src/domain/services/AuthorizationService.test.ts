import { beforeEach, describe, expect, it, vi } from "vitest"
import * as factories from "@test/factories"
import { mockEventPublisher, mockSigningKeyRepository, mockTokenIssuer } from "@test/mocks"
import { AuthorizationError, commonErrors } from "~/domain/errors"
import { AuthorizationService } from "./AuthorizationService"

describe("AuthorizationService", () => {
  let service: AuthorizationService

  beforeEach(() => {
    service = new AuthorizationService(
      mockSigningKeyRepository,
      mockTokenIssuer,
      mockEventPublisher
    )
    vi.clearAllMocks()
  })

  describe("issueAccessToken", () => {
    it("should issue access token with session", async () => {
      const user = factories.createUser()
      const session = factories.createLocalSession()
      const signingKey = factories.createSigningKey()
      const tokenResponse = { accessToken: "mock-token", expiresIn: 3600 }

      mockSigningKeyRepository.tryGetActiveSigningKey.mockResolvedValue(signingKey)
      mockTokenIssuer.createAccessToken.mockReturnValue(tokenResponse)

      const result = await service.issueAccessToken(user, undefined, session)

      expect(result).toBe(tokenResponse)
      expect(mockEventPublisher.publishEvent).toHaveBeenCalled()
    })

    it("should issue access token without session", async () => {
      const user = factories.createUser()
      const signingKey = factories.createSigningKey()
      const tokenResponse = { accessToken: "mock-token", expiresIn: 3600 }

      mockSigningKeyRepository.tryGetActiveSigningKey.mockResolvedValue(signingKey)
      mockTokenIssuer.createAccessToken.mockReturnValue(tokenResponse)

      const result = await service.issueAccessToken(user)

      expect(result).toBe(tokenResponse)
    })

    it("should issue access token with impersonation", async () => {
      const user = factories.createUser( { roles: [] })
      const impersonatingUser = factories.createUser( { roles: ["employee"] })
      const session = factories.createLocalSession()
      const signingKey = factories.createSigningKey()
      const tokenResponse = { accessToken: "mock-token", expiresIn: 3600 }

      mockSigningKeyRepository.tryGetActiveSigningKey.mockResolvedValue(signingKey)
      mockTokenIssuer.createAccessToken.mockReturnValue(tokenResponse)

      const result = await service.issueAccessToken(user, impersonatingUser, session)

      expect(result).toBe(tokenResponse)
    })

    it("should throw error when no active signing key found", async () => {
      const user = factories.createUser()
      mockSigningKeyRepository.tryGetActiveSigningKey.mockResolvedValue(undefined)

      await expect(service.issueAccessToken(user))
        .rejects.toThrow("No active signing key found.")
    })

    it("should throw error when impersonation is not allowed", async () => {
      const user = factories.createUser({ roles: ["employee"] })
      const impersonatingUser = factories.createUser({ roles: ["employee"] })
      const session = factories.createLocalSession()
      const signingKey = factories.createSigningKey()

      mockSigningKeyRepository.tryGetActiveSigningKey.mockResolvedValue(signingKey)

      await expect(service.issueAccessToken(user, impersonatingUser, session))
        .rejects.toThrow(new AuthorizationError(commonErrors.impersonationNotAllowed))

      expect(mockEventPublisher.publishEvent).toHaveBeenCalled()
    })
  })
})

