import { SessionService } from "./SessionService"
import { IdentityProviderRepository, SessionRepository } from "~/domain/repositories"
import { AuthClientFactory, EventPublisher, SignInResponse } from "~/domain/adapters"
import { AuthenticationError, commonErrors } from "~/domain/errors"
import { Session, IdentityProvider } from "~/domain/entities"

// Mock implementations
const mockAuthClientFactory = {
  createClient: jest.fn(),
} as jest.Mocked<AuthClientFactory>

const mockIdentityProviderRepository = {
  query: jest.fn(),
  getById: jest.fn(),
  tryGetById: jest.fn(),
  tryGetByName: jest.fn(),
  tryGetByIssuerUrlAndAudience: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
} as jest.Mocked<IdentityProviderRepository>

const mockSessionRepository = {
  query: jest.fn(),
  getById: jest.fn(),
  tryGetById: jest.fn(),
  tryGetByIdentityProviderSessionId: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
} as jest.Mocked<SessionRepository>

const mockEventPublisher = {
  publishEvent: jest.fn(),
} as jest.Mocked<EventPublisher>

const mockSessionConfig = {
  localSessionLifetimeHours: 24,
  externalSessionLifetimeHours: 48,
  minSessionRefreshDelayMinutes: 5,
}

const mockAuthClient = {
  supportsSignOut: true,
  supportsEditProfile: false,
  createSignInRequest: jest.fn(),
  createSignOutRequest: jest.fn(),
  processSignInResponse: jest.fn(),
  checkSessionWithRefreshToken: jest.fn(),
  editProfile: jest.fn(),
}

// Test utilities
const createMockSession = (overrides: Partial<Session> = {}): Session => ({
  id: "session-123",
  userId: "user-123",
  nonce: "nonce-123",
  identityProviderId: null,
  refreshToken: null,
  isActive: true,
  ensureIsActive: jest.fn(),
  isIdentityProviderRefreshDue: jest.fn().mockReturnValue(false),
  terminateLocalSessionByUser: jest.fn(),
  terminateIdentityProviderSessionByUser: jest.fn(),
  terminateSessionByIdentityProvider: jest.fn(),
  setLastRefresh: jest.fn(),
  ...overrides,
} as any)

const createMockIdentityProvider = (overrides: Partial<IdentityProvider> = {}): IdentityProvider => ({
  id: "idp-123",
  name: "Test IDP",
  ...overrides,
} as any)

const createMockSignInResponse = (overrides: Partial<SignInResponse> = {}): SignInResponse => ({
  profile: {
    identifierClaimValue: "external-id",
    email: "test@example.com",
    givenName: "John",
    surname: "Doe"
  },
  idToken: "id-token",
  refreshToken: "refresh-token",
  sessionId: "external-session-123",
  ...overrides,
})

describe("SessionService", () => {
  let service: SessionService

  beforeEach(() => {
    service = new SessionService(
      mockAuthClientFactory,
      mockIdentityProviderRepository,
      mockSessionRepository,
      mockSessionConfig,
      mockEventPublisher
    )
    jest.clearAllMocks()
  })

  describe("getActiveSessionById", () => {
    it("should return active session when valid", async () => {
      const mockSession = createMockSession()
      mockSessionRepository.tryGetById.mockResolvedValue(mockSession)

      const result = await service.getActiveSessionById("session-123", "nonce-123")

      expect(result).toBe(mockSession)
      expect(mockSessionRepository.tryGetById).toHaveBeenCalledWith("session-123")
      expect(mockSession.ensureIsActive).toHaveBeenCalled()
    })

    it("should throw error when session not found", async () => {
      mockSessionRepository.tryGetById.mockResolvedValue(undefined)

      await expect(service.getActiveSessionById("session-123", "nonce-123"))
        .rejects.toThrow(new AuthenticationError(commonErrors.sessionExpired))
    })

    it("should throw error when nonce mismatch", async () => {
      const mockSession = createMockSession({ nonce: "different-nonce" })
      mockSessionRepository.tryGetById.mockResolvedValue(mockSession)

      await expect(service.getActiveSessionById("session-123", "nonce-123"))
        .rejects.toThrow(new AuthenticationError(commonErrors.sessionInvalid))

      expect(mockEventPublisher.publishEvent).toHaveBeenCalled()
    })
  })

  describe("tryGetSessionByIdentityProviderSessionId", () => {
    it("should return session by identity provider session id", async () => {
      const mockSession = createMockSession()
      mockSessionRepository.tryGetByIdentityProviderSessionId.mockResolvedValue(mockSession)

      const result = await service.tryGetSessionByIdentityProviderSessionId("external-session-123")

      expect(result).toBe(mockSession)
      expect(mockSessionRepository.tryGetByIdentityProviderSessionId)
        .toHaveBeenCalledWith("external-session-123")
    })
  })

  describe("startLocalSession", () => {
    it("should create and insert local session", async () => {
      const mockSession = createMockSession()
      jest.spyOn(Session, 'createNew').mockReturnValue(mockSession)

      const result = await service.startLocalSession("user-123")

      expect(result).toBe(mockSession)
      expect(Session.createNew).toHaveBeenCalledWith(
        {
          userId: "user-123",
          identityProviderId: null,
          identityProviderSessionId: null,
          idToken: null,
          refreshToken: null,
        },
        24
      )
      expect(mockSessionRepository.insert).toHaveBeenCalledWith(mockSession)
      expect(mockEventPublisher.publishEvent).toHaveBeenCalled()
    })
  })

  describe("startIdentityProviderSession", () => {
    it("should create and insert identity provider session", async () => {
      const mockSession = createMockSession()
      const mockSignInResponse = createMockSignInResponse()
      jest.spyOn(Session, 'createNew').mockReturnValue(mockSession)

      const result = await service.startIdentityProviderSession("user-123", "idp-123", mockSignInResponse)

      expect(result).toBe(mockSession)
      expect(Session.createNew).toHaveBeenCalledWith(
        {
          userId: "user-123",
          identityProviderId: "idp-123",
          identityProviderSessionId: "external-session-123",
          idToken: "id-token",
          refreshToken: "refresh-token",
        },
        48
      )
      expect(mockSessionRepository.insert).toHaveBeenCalledWith(mockSession)
    })

    it("should handle sign-in response without optional fields", async () => {
      const mockSession = createMockSession()
      const mockSignInResponse = createMockSignInResponse({
        sessionId: undefined,
        refreshToken: undefined
      })
      jest.spyOn(Session, 'createNew').mockReturnValue(mockSession)

      await service.startIdentityProviderSession("user-123", "idp-123", mockSignInResponse)

      expect(Session.createNew).toHaveBeenCalledWith(
        {
          userId: "user-123",
          identityProviderId: "idp-123",
          identityProviderSessionId: null,
          idToken: "id-token",
          refreshToken: null,
        },
        48
      )
    })
  })

  describe("terminateLocalSessionByUser", () => {
    it("should terminate local session and update", async () => {
      const mockSession = createMockSession()

      await service.terminateLocalSessionByUser(mockSession)

      expect(mockSession.terminateLocalSessionByUser).toHaveBeenCalled()
      expect(mockSessionRepository.update).toHaveBeenCalledWith(mockSession)
      expect(mockEventPublisher.publishEvent).toHaveBeenCalled()
    })
  })

  describe("terminateIdentityProviderSessionByUser", () => {
    it("should terminate identity provider session and update", async () => {
      const mockSession = createMockSession()

      await service.terminateIdentityProviderSessionByUser(mockSession)

      expect(mockSession.terminateIdentityProviderSessionByUser).toHaveBeenCalled()
      expect(mockSessionRepository.update).toHaveBeenCalledWith(mockSession)
      expect(mockEventPublisher.publishEvent).toHaveBeenCalled()
    })
  })

  describe("terminateSessionByIdentityProvider", () => {
    it("should terminate session by identity provider and update", async () => {
      const mockSession = createMockSession()

      await service.terminateSessionByIdentityProvider(mockSession)

      expect(mockSession.terminateSessionByIdentityProvider).toHaveBeenCalled()
      expect(mockSessionRepository.update).toHaveBeenCalledWith(mockSession)
      expect(mockEventPublisher.publishEvent).toHaveBeenCalled()
    })
  })

  describe("refreshSession", () => {
    it("should refresh session when not due for refresh", async () => {
      const mockSession = createMockSession()

      const result = await service.refreshSession(mockSession)

      expect(result).toBe(mockSession)
      expect(mockSession.ensureIsActive).toHaveBeenCalled()
      expect(mockSession.isIdentityProviderRefreshDue).toHaveBeenCalledWith(5)
      expect(mockSession.setLastRefresh).toHaveBeenCalledWith(undefined, undefined)
      expect(mockSessionRepository.update).toHaveBeenCalledWith(mockSession)
    })

    it("should refresh session when due and valid refresh token", async () => {
      const mockSession = createMockSession({
        identityProviderId: "idp-123",
        refreshToken: "refresh-token",
        isIdentityProviderRefreshDue: jest.fn().mockReturnValue(true)
      })
      const mockIdp = createMockIdentityProvider()
      
      mockIdentityProviderRepository.getById.mockResolvedValue(mockIdp)
      mockAuthClientFactory.createClient.mockReturnValue(mockAuthClient)
      mockAuthClient.checkSessionWithRefreshToken.mockResolvedValue({
        valid: true,
        idToken: "new-id-token",
        refreshToken: "new-refresh-token"
      })

      const result = await service.refreshSession(mockSession)

      expect(result).toBe(mockSession)
      expect(mockAuthClientFactory.createClient).toHaveBeenCalledWith(mockIdp)
      expect(mockAuthClient.checkSessionWithRefreshToken).toHaveBeenCalledWith("refresh-token")
      expect(mockSession.setLastRefresh).toHaveBeenCalledWith("new-id-token", "new-refresh-token")
    })

    it("should terminate session when refresh token is invalid", async () => {
      const mockSession = createMockSession({
        identityProviderId: "idp-123",
        refreshToken: "refresh-token",
        isIdentityProviderRefreshDue: jest.fn().mockReturnValue(true)
      })
      const mockIdp = createMockIdentityProvider()
      
      mockIdentityProviderRepository.getById.mockResolvedValue(mockIdp)
      mockAuthClientFactory.createClient.mockReturnValue(mockAuthClient)
      mockAuthClient.checkSessionWithRefreshToken.mockResolvedValue({
        valid: false
      })

      const result = await service.refreshSession(mockSession)

      expect(result).toBe(mockSession)
      expect(mockSession.terminateSessionByIdentityProvider).toHaveBeenCalled()
    })

    it("should not refresh when session has no identity provider", async () => {
      const mockSession = createMockSession({
        identityProviderId: null,
        isIdentityProviderRefreshDue: jest.fn().mockReturnValue(true)
      })

      const result = await service.refreshSession(mockSession)

      expect(result).toBe(mockSession)
      expect(mockSession.setLastRefresh).toHaveBeenCalledWith(undefined, undefined)
      expect(mockIdentityProviderRepository.getById).not.toHaveBeenCalled()
    })

    it("should not refresh when session has no refresh token", async () => {
      const mockSession = createMockSession({
        identityProviderId: "idp-123",
        refreshToken: null,
        isIdentityProviderRefreshDue: jest.fn().mockReturnValue(true)
      })

      const result = await service.refreshSession(mockSession)

      expect(result).toBe(mockSession)
      expect(mockSession.setLastRefresh).toHaveBeenCalledWith(undefined, undefined)
      expect(mockIdentityProviderRepository.getById).not.toHaveBeenCalled()
    })
  })
})
