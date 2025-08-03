import { randomUUID } from "crypto"
import * as factories from "@test/factories"
import { mockAuthClient, mockAuthClientFactory, mockEventPublisher, mockIdentityProviderRepository, mockSessionRepository } from "@test/mocks"
import { Session, SessionStatus } from "~/domain/entities"
import { AuthenticationError, commonErrors } from "~/domain/errors"
import { SessionService } from "./SessionService"

describe("SessionService", () => {
  let service: SessionService

  beforeEach(() => {
    const sessionConfig = {
      localSessionLifetimeHours: 24,
      externalSessionLifetimeHours: 48,
      minSessionRefreshDelayMinutes: 1,
    }
    service = new SessionService(
      mockAuthClientFactory,
      mockIdentityProviderRepository,
      mockSessionRepository,
      sessionConfig,
      mockEventPublisher,
    )
    jest.clearAllMocks()
  })

  describe("getActiveSessionById", () => {
    it("should return active session when valid", async () => {
      const session = factories.createLocalSession()
      mockSessionRepository.tryGetById.mockResolvedValue(session)

      const result = await service.getActiveSessionById(session.id, session.nonce)

      expect(result).toBe(session)
    })

    it("should throw error when nonce mismatch", async () => {
      const session = factories.createLocalSession()
      mockSessionRepository.tryGetById.mockResolvedValue(session)

      await expect(service.getActiveSessionById(session.id, "nonce-123"))
        .rejects.toThrow(new AuthenticationError(commonErrors.sessionInvalid))

      expect(mockEventPublisher.publishEvent).toHaveBeenCalled()
    })

    it("should throw error when session is inactive", async () => {
      const session = factories.createLocalSession()
      session.terminateSessionByAdmin()
      mockSessionRepository.tryGetById.mockResolvedValue(session)

      await expect(service.getActiveSessionById(session.id, session.nonce))
        .rejects.toThrow(new AuthenticationError(commonErrors.sessionExpired))
    })

    it("should throw error when session not found", async () => {
      mockSessionRepository.tryGetById.mockResolvedValue(undefined)

      await expect(service.getActiveSessionById("session-123", "nonce-123"))
        .rejects.toThrow(new AuthenticationError(commonErrors.sessionExpired))
    })
  })

  describe("startLocalSession", () => {
    it("should create and insert local session", async () => {
      const userId = randomUUID()

      const session = await service.startLocalSession(userId)

      expect(session).toEqual(expect.objectContaining({ userId }))
      expect(mockSessionRepository.insert).toHaveBeenCalledWith(session)
      expect(mockEventPublisher.publishEvent).toHaveBeenCalled()
    })
  })

  describe("startIdentityProviderSession", () => {
    it("should create and insert identity provider session", async () => {
      const userId = randomUUID()
      const identityProviderId = randomUUID()
      const signInResponse = {
        profile: {
          identifierClaimValue: "external-id",
          email: "test@example.com",
          givenName: "John",
          surname: "Doe"
        },
        idToken: "id-token",
        refreshToken: "refresh-token",
        sessionId: "external-session-123",
      }

      const session = await service.startIdentityProviderSession(userId, identityProviderId, signInResponse)

      expect(session).toEqual(expect.objectContaining({ userId, identityProviderId }))
      expect(mockSessionRepository.insert).toHaveBeenCalledWith(session)
      expect(mockEventPublisher.publishEvent).toHaveBeenCalled()
    })
  })

  describe("terminateLocalSessionByUser", () => {
    it("should terminate local session and update", async () => {
      const session = factories.createLocalSession()

      await service.terminateLocalSessionByUser(session)

      expect(session.status).toBe(SessionStatus.TerminatedByUser)
      expect(session.terminatedAt).toBeDefined()
      expect(mockSessionRepository.update).toHaveBeenCalledWith(session)
      expect(mockEventPublisher.publishEvent).toHaveBeenCalled()
    })
  })

  describe("terminateIdentityProviderSessionByUser", () => {
    it("should terminate identity provider session and update", async () => {
      const session = factories.createIdentityProviderSession()

      await service.terminateIdentityProviderSessionByUser(session)

      expect(session.status).toBe(SessionStatus.TerminatedByUser)
      expect(session.terminatedAt).toBeDefined()
      expect(mockSessionRepository.update).toHaveBeenCalledWith(session)
      expect(mockEventPublisher.publishEvent).toHaveBeenCalled()
    })
  })

  describe("terminateSessionByIdentityProvider", () => {
    it("should terminate session by identity provider and update", async () => {
      const session = factories.createIdentityProviderSession()

      await service.terminateSessionByIdentityProvider(session)

      expect(session.status).toBe(SessionStatus.TerminatedByProvider)
      expect(session.terminatedAt).toBeDefined()
      expect(mockSessionRepository.update).toHaveBeenCalledWith(session)
      expect(mockEventPublisher.publishEvent).toHaveBeenCalled()
    })
  })

  describe("refreshSession", () => {
    it("should refresh session when not due for refresh", async () => {
      const session = factories.createIdentityProviderSession()

      await service.refreshSession(session)

      expect(session.status).toBe(SessionStatus.Active)
      expect(mockSessionRepository.update).toHaveBeenCalledWith(session)
    })

    it("should refresh session when due and valid refresh token", async () => {
      let session = factories.createIdentityProviderSession()
      session = new Session({ ...session.props, lastRefreshAt: new Date(Date.now() - 120000) })
      const idp = factories.createIdentityProvider()
      
      mockIdentityProviderRepository.getById.mockResolvedValue(idp)
      mockAuthClientFactory.createClient.mockReturnValue(mockAuthClient)
      mockAuthClient.checkSessionWithRefreshToken.mockResolvedValue({
        valid: true,
        idToken: "new-id-token",
        refreshToken: "new-refresh-token"
      })

      await service.refreshSession(session)

      expect(session.status).toBe(SessionStatus.Active)
      expect(session.idToken).toBe("new-id-token")
      expect(session.refreshToken).toBe("new-refresh-token")
      expect(session.lastRefreshAt).not.toBe(session.createdAt)
      expect(mockSessionRepository.update).toHaveBeenCalled()
    })

    it("should terminate session when refresh token is invalid", async () => {
      let session = factories.createIdentityProviderSession()
      session = new Session({ ...session.props, lastRefreshAt: new Date(Date.now() - 120000) })
      const idp = factories.createIdentityProvider()

      mockIdentityProviderRepository.getById.mockResolvedValue(idp)
      mockAuthClientFactory.createClient.mockReturnValue(mockAuthClient)
      mockAuthClient.checkSessionWithRefreshToken.mockResolvedValue({ valid: false })

      await service.refreshSession(session)

      expect(session.status).toBe(SessionStatus.TerminatedByProvider)
      expect(session.refreshToken).toBeNull()
      expect(session.lastRefreshAt).not.toBe(session.createdAt)
      expect(mockSessionRepository.update).toHaveBeenCalled()
    })

    it("should not refresh when session has no refresh token", async () => {
      const session = factories.createIdentityProviderSession({ refreshToken: null })
      const idp = factories.createIdentityProvider()

      mockIdentityProviderRepository.getById.mockResolvedValue(idp)
      mockAuthClientFactory.createClient.mockReturnValue(mockAuthClient)

      await service.refreshSession(session)

      expect(session.status).toBe(SessionStatus.Active)
      expect(mockAuthClientFactory.createClient).not.toHaveBeenCalled()
    })
  })
})
