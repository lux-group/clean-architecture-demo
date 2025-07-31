import { AuthorizationService } from "./AuthorizationService"
import { SigningKeyRepository } from "~/domain/repositories"
import { EventPublisher, TokenIssuer, TokenResponse } from "~/domain/adapters"
import { AuthorizationError, commonErrors } from "~/domain/errors"
import { User, Session, SigningKey } from "~/domain/entities"

// Mock implementations
const mockSigningKeyRepository = {
  query: jest.fn(),
  getById: jest.fn(),
  tryGetById: jest.fn(),
  tryGetActiveSigningKey: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
} as jest.Mocked<SigningKeyRepository>

const mockTokenIssuer = {
  createAccessToken: jest.fn(),
} as jest.Mocked<TokenIssuer>

const mockEventPublisher = {
  publishEvent: jest.fn(),
} as jest.Mocked<EventPublisher>

// Test utilities
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: "user-123",
  brand: "test-brand",
  email: "test@example.com",
  roles: ["user"],
  canImpersonateUser: jest.fn().mockReturnValue(true),
  ...overrides,
} as any)

const createMockSession = (overrides: Partial<Session> = {}): Session => ({
  id: "session-123",
  userId: "user-123",
  ...overrides,
} as any)

const createMockSigningKey = (overrides: Partial<SigningKey> = {}): SigningKey => ({
  id: "key-123",
  privateKey: "private-key-data",
  publicKey: "public-key-data",
  isActive: true,
  ...overrides,
} as any)

const createMockTokenResponse = (): TokenResponse => ({
  accessToken: "mock-access-token",
  expiresIn: 3600,
})

describe("AuthorizationService", () => {
  let service: AuthorizationService

  beforeEach(() => {
    service = new AuthorizationService(
      mockSigningKeyRepository,
      mockTokenIssuer,
      mockEventPublisher
    )
    jest.clearAllMocks()
  })

  describe("issueAccessToken", () => {
    it("should issue access token successfully", async () => {
      const mockUser = createMockUser()
      const mockSession = createMockSession()
      const mockSigningKey = createMockSigningKey()
      const mockTokenResponse = createMockTokenResponse()

      mockSigningKeyRepository.tryGetActiveSigningKey.mockResolvedValue(mockSigningKey)
      mockTokenIssuer.createAccessToken.mockReturnValue(mockTokenResponse)

      const result = await service.issueAccessToken(mockUser, undefined, mockSession)

      expect(result).toBe(mockTokenResponse)
      expect(mockSigningKeyRepository.tryGetActiveSigningKey).toHaveBeenCalled()
      expect(mockTokenIssuer.createAccessToken).toHaveBeenCalledWith(
        mockUser,
        mockSigningKey,
        expect.objectContaining({
          sessionId: "session-123",
          audience: undefined,
          claims: {
            brand: "test-brand",
            roles: ["user"],
            impersonated_by_sub: undefined
          }
        })
      )
      expect(mockEventPublisher.publishEvent).toHaveBeenCalled()
    })

    it("should issue access token with impersonation", async () => {
      const mockUser = createMockUser()
      const mockImpersonatingUser = createMockUser({ id: "admin-123" })
      const mockSession = createMockSession()
      const mockSigningKey = createMockSigningKey()
      const mockTokenResponse = createMockTokenResponse()

      mockSigningKeyRepository.tryGetActiveSigningKey.mockResolvedValue(mockSigningKey)
      mockTokenIssuer.createAccessToken.mockReturnValue(mockTokenResponse)

      const result = await service.issueAccessToken(mockUser, mockImpersonatingUser, mockSession)

      expect(result).toBe(mockTokenResponse)
      expect(mockTokenIssuer.createAccessToken).toHaveBeenCalledWith(
        mockUser,
        mockSigningKey,
        expect.objectContaining({
          claims: expect.objectContaining({
            impersonated_by_sub: "admin-123"
          })
        })
      )
    })

    it("should issue access token without session", async () => {
      const mockUser = createMockUser()
      const mockSigningKey = createMockSigningKey()
      const mockTokenResponse = createMockTokenResponse()

      mockSigningKeyRepository.tryGetActiveSigningKey.mockResolvedValue(mockSigningKey)
      mockTokenIssuer.createAccessToken.mockReturnValue(mockTokenResponse)

      const result = await service.issueAccessToken(mockUser)

      expect(result).toBe(mockTokenResponse)
      expect(mockTokenIssuer.createAccessToken).toHaveBeenCalledWith(
        mockUser,
        mockSigningKey,
        expect.objectContaining({
          sessionId: undefined,
          claims: expect.objectContaining({
            impersonated_by_sub: undefined
          })
        })
      )
    })

    it("should throw error when no active signing key found", async () => {
      const mockUser = createMockUser()
      mockSigningKeyRepository.tryGetActiveSigningKey.mockResolvedValue(undefined)

      await expect(service.issueAccessToken(mockUser))
        .rejects.toThrow("No active signing key found.")
    })

    it("should throw error when signing key has no private key", async () => {
      const mockUser = createMockUser()
      const mockSigningKey = createMockSigningKey({ privateKey: undefined })
      mockSigningKeyRepository.tryGetActiveSigningKey.mockResolvedValue(mockSigningKey)

      await expect(service.issueAccessToken(mockUser))
        .rejects.toThrow("No active signing key found.")
    })

    it("should throw error when audience parameter is provided", async () => {
      const mockUser = createMockUser()
      const mockSigningKey = createMockSigningKey()
      mockSigningKeyRepository.tryGetActiveSigningKey.mockResolvedValue(mockSigningKey)

      await expect(service.issueAccessToken(mockUser, undefined, undefined, "test-audience"))
        .rejects.toThrow(new AuthorizationError("OAuth2 parameter 'audience' is not supported."))
    })

    it("should throw error when scope parameter is provided", async () => {
      const mockUser = createMockUser()
      const mockSigningKey = createMockSigningKey()
      mockSigningKeyRepository.tryGetActiveSigningKey.mockResolvedValue(mockSigningKey)

      await expect(service.issueAccessToken(mockUser, undefined, undefined, undefined, "read write"))
        .rejects.toThrow(new AuthorizationError("OAuth2 parameter 'scope' is not supported."))
    })

    it("should throw error when impersonation is not allowed", async () => {
      const mockUser = createMockUser()
      const mockImpersonatingUser = createMockUser({ 
        id: "admin-123",
        canImpersonateUser: jest.fn().mockReturnValue(false)
      })
      const mockSession = createMockSession()
      const mockSigningKey = createMockSigningKey()

      mockSigningKeyRepository.tryGetActiveSigningKey.mockResolvedValue(mockSigningKey)

      await expect(service.issueAccessToken(mockUser, mockImpersonatingUser, mockSession))
        .rejects.toThrow(new AuthorizationError(commonErrors.impersonationNotAllowed))

      expect(mockEventPublisher.publishEvent).toHaveBeenCalled()
    })
  })
})
