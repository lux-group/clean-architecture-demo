import { AuthenticationService } from "./AuthenticationService"
import { UserRepository } from "~/domain/repositories"
import { EventPublisher, PasswordVerifier, TokenValidator } from "~/domain/adapters"
import { AuthenticationError, commonErrors } from "~/domain/errors"
import { Session, User, IdentityProvider, UserIdentity } from "~/domain/entities"

// Mock implementations
const mockUserRepository = {
  query: jest.fn(),
  getById: jest.fn(),
  tryGetById: jest.fn(),
  tryGetByBrandAndEmail: jest.fn(),
  tryGetByExternalIdentity: jest.fn(),
  update: jest.fn(),
  insert: jest.fn(),
  delete: jest.fn(),
} as jest.Mocked<UserRepository>

const mockEventPublisher = {
  publishEvent: jest.fn(),
} as jest.Mocked<EventPublisher>

const mockPasswordVerifier = {
  verifyPassword: jest.fn(),
  createPasswordHash: jest.fn(),
} as jest.Mocked<PasswordVerifier>

const mockTokenValidator = {
  decodeAndValidateToken: jest.fn(),
} as jest.Mocked<TokenValidator>

// Test utilities
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: "user-123",
  brand: "test-brand",
  email: "test@example.com",
  isEnabled: true,
  passwordHash: "hashed-password",
  roles: ["user"],
  identities: [],
  canSignInWithActiveSession: jest.fn().mockReturnValue(true),
  canSignInWithPassword: jest.fn().mockReturnValue(true),
  canSignInWithClientSecret: jest.fn().mockReturnValue(true),
  canSignInWithIdentityProvider: jest.fn().mockReturnValue(true),
  handleFailedSignInAttempt: jest.fn(),
  addIdentity: jest.fn(),
  ...overrides,
} as any)

const createMockSession = (overrides: Partial<Session> = {}): Session => ({
  id: "session-123",
  userId: "user-123",
  isActive: true,
  ...overrides,
} as any)

const createMockIdentityProvider = (overrides: Partial<IdentityProvider> = {}): IdentityProvider => ({
  id: "idp-123",
  authSettings: {
    type: "ENTRA",
    brand: "test-brand",
    clientId: "client-123",
    clientSecret: "secret-123",
    redirectUrls: ["https://example.com/callback"],
    autoLinkUsers: false,
    autoCreateUsers: false,
  },
  ...overrides,
} as any)

describe("AuthenticationService", () => {
  let service: AuthenticationService

  beforeEach(() => {
    service = new AuthenticationService(
      mockUserRepository,
      mockEventPublisher,
      mockPasswordVerifier,
      mockTokenValidator
    )
    jest.clearAllMocks()
  })

  describe("authenticateWithActiveSession", () => {
    it("should authenticate user with active session successfully", async () => {
      const mockUser = createMockUser()
      const mockSession = createMockSession()
      mockUserRepository.tryGetById.mockResolvedValue(mockUser)

      const result = await service.authenticateWithActiveSession(mockSession)

      expect(result).toBe(mockUser)
      expect(mockUserRepository.tryGetById).toHaveBeenCalledWith("user-123")
      expect(mockEventPublisher.publishEvent).toHaveBeenCalled()
    })

    it("should throw error when session is not active", async () => {
      const mockSession = createMockSession({ isActive: false })

      await expect(service.authenticateWithActiveSession(mockSession))
        .rejects.toThrow(new AuthenticationError(commonErrors.sessionExpired))

      expect(mockEventPublisher.publishEvent).toHaveBeenCalledWith("Authentication",
        expect.objectContaining({
          result: "Failed",
          reason: commonErrors.sessionExpired
        })
      )
    })

    it("should throw error when user not found", async () => {
      const mockSession = createMockSession()
      mockUserRepository.tryGetById.mockResolvedValue(undefined)

      await expect(service.authenticateWithActiveSession(mockSession))
        .rejects.toThrow(new AuthenticationError(commonErrors.authenticationFailed))
    })

    it("should throw error when user cannot sign in with active session", async () => {
      const mockUser = createMockUser({
        canSignInWithActiveSession: jest.fn().mockReturnValue(false)
      })
      const mockSession = createMockSession()
      mockUserRepository.tryGetById.mockResolvedValue(mockUser)

      await expect(service.authenticateWithActiveSession(mockSession))
        .rejects.toThrow(new AuthenticationError(commonErrors.authenticationMethodNotAllowed))
    })
  })

  describe("authenticateWithEmailAndPassword", () => {
    it("should authenticate user with email and password successfully", async () => {
      const mockUser = createMockUser()
      mockUserRepository.tryGetByBrandAndEmail.mockResolvedValue(mockUser)
      mockPasswordVerifier.verifyPassword.mockReturnValue(true)

      const result = await service.authenticateWithEmailAndPassword("test-brand", "test@example.com", "password")

      expect(result).toBe(mockUser)
      expect(mockUserRepository.tryGetByBrandAndEmail).toHaveBeenCalledWith("test-brand", "test@example.com")
      expect(mockPasswordVerifier.verifyPassword).toHaveBeenCalledWith("password", "hashed-password")
      expect(mockEventPublisher.publishEvent).toHaveBeenCalledWith("Authentication",
        expect.objectContaining({ result: "Success" })
      )
    })

    it("should throw error when user not found", async () => {
      mockUserRepository.tryGetByBrandAndEmail.mockResolvedValue(undefined)

      await expect(service.authenticateWithEmailAndPassword("test-brand", "test@example.com", "password"))
        .rejects.toThrow(new AuthenticationError(commonErrors.authenticationFailed))
    })

    it("should throw error when password verification fails", async () => {
      const mockUser = createMockUser()
      mockUserRepository.tryGetByBrandAndEmail.mockResolvedValue(mockUser)
      mockPasswordVerifier.verifyPassword.mockReturnValue(false)

      await expect(service.authenticateWithEmailAndPassword("test-brand", "test@example.com", "wrong-password"))
        .rejects.toThrow(new AuthenticationError(commonErrors.authenticationFailed))

      expect(mockUser.handleFailedSignInAttempt).toHaveBeenCalled()
    })

    it("should throw error when user cannot sign in with password", async () => {
      const mockUser = createMockUser({
        canSignInWithPassword: jest.fn().mockReturnValue(false)
      })
      mockUserRepository.tryGetByBrandAndEmail.mockResolvedValue(mockUser)

      await expect(service.authenticateWithEmailAndPassword("test-brand", "test@example.com", "password"))
        .rejects.toThrow(new AuthenticationError(commonErrors.authenticationMethodNotAllowed))
    })
  })

  describe("authenticateWithClientCredentials", () => {
    it("should authenticate client with credentials successfully", async () => {
      const mockUser = createMockUser()
      mockUserRepository.tryGetById.mockResolvedValue(mockUser)
      mockPasswordVerifier.verifyPassword.mockReturnValue(true)

      const result = await service.authenticateWithClientCredentials("client-id", "client-secret")

      expect(result).toBe(mockUser)
      expect(mockUserRepository.tryGetById).toHaveBeenCalledWith("client-id")
      expect(mockPasswordVerifier.verifyPassword).toHaveBeenCalledWith("client-secret", "hashed-password")
    })

    it("should throw error when client not found", async () => {
      mockUserRepository.tryGetById.mockResolvedValue(undefined)

      await expect(service.authenticateWithClientCredentials("client-id", "client-secret"))
        .rejects.toThrow(new AuthenticationError(commonErrors.authenticationFailed))
    })

    it("should throw error when client cannot use client credentials", async () => {
      const mockUser = createMockUser({
        canSignInWithClientSecret: jest.fn().mockReturnValue(false)
      })
      mockUserRepository.tryGetById.mockResolvedValue(mockUser)

      await expect(service.authenticateWithClientCredentials("client-id", "client-secret"))
        .rejects.toThrow(new AuthenticationError(commonErrors.authenticationMethodNotAllowed))
    })
  })

  describe("authenticateWithExternalIdentityToken", () => {
    it("should authenticate with external identity token successfully", async () => {
      const mockUser = createMockUser()
      const mockIdp = createMockIdentityProvider()
      const mockProfile = {
        identifierClaimValue: "external-id",
        email: "test@example.com",
        givenName: "John",
        surname: "Doe"
      }

      mockTokenValidator.decodeAndValidateToken.mockResolvedValue({
        identityProvider: mockIdp,
        profile: mockProfile
      })
      mockUserRepository.tryGetByExternalIdentity.mockResolvedValue(mockUser)

      const result = await service.authenticateWithExternalIdentityToken("token")

      expect(result).toBe(mockUser)
      expect(mockTokenValidator.decodeAndValidateToken).toHaveBeenCalledWith("token")
    })

    it("should throw error when token validation fails", async () => {
      mockTokenValidator.decodeAndValidateToken.mockRejectedValue(new Error("Invalid token"))

      await expect(service.authenticateWithExternalIdentityToken("invalid-token"))
        .rejects.toThrow(new AuthenticationError(commonErrors.authenticationFailed))

      expect(mockEventPublisher.publishEvent).toHaveBeenCalledWith("Authentication",
        expect.objectContaining({
          result: "Failed",
          reason: commonErrors.authenticationFailed
        })
      )
    })
  })

  describe("authenticateWithExternalIdentity", () => {
    it("should authenticate existing user with external identity", async () => {
      const mockUser = createMockUser()
      const mockIdp = createMockIdentityProvider()
      const mockProfile = {
        identifierClaimValue: "external-id",
        email: "test@example.com",
        givenName: "John",
        surname: "Doe"
      }
      
      mockUserRepository.tryGetByExternalIdentity.mockResolvedValue(mockUser)

      const result = await service.authenticateWithExternalIdentity(mockIdp, mockProfile)

      expect(result.user).toBe(mockUser)
      expect(result.newIdentity).toBeUndefined()
      expect(mockUserRepository.tryGetByExternalIdentity).toHaveBeenCalledWith("idp-123", "external-id")
    })

    it("should auto-link existing user when configured", async () => {
      const mockUser = createMockUser()
      const mockNewIdentity = { identityProviderId: "idp-123" } as UserIdentity
      const mockIdp = createMockIdentityProvider({
        authSettings: {
          type: "ENTRA",
          brand: "test-brand",
          clientId: "client-123",
          clientSecret: "secret-123",
          redirectUrls: ["https://example.com/callback"],
          autoLinkUsers: true,
          autoCreateUsers: false
        }
      })
      const mockProfile = {
        identifierClaimValue: "external-id",
        email: "test@example.com",
        givenName: "John",
        surname: "Doe"
      }

      mockUserRepository.tryGetByExternalIdentity.mockResolvedValue(undefined)
      mockUserRepository.tryGetByBrandAndEmail.mockResolvedValue(mockUser)
      mockUser.addIdentity = jest.fn().mockReturnValue(mockNewIdentity)

      const result = await service.authenticateWithExternalIdentity(mockIdp, mockProfile)

      expect(result.user).toBe(mockUser)
      expect(result.newIdentity).toBe(mockNewIdentity)
      expect(mockUser.addIdentity).toHaveBeenCalledWith("idp-123", "external-id")
      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser)
    })

    it("should auto-create new user when configured", async () => {
      const mockNewUser = createMockUser()
      const mockNewIdentity = { identityProviderId: "idp-123" } as UserIdentity
      const mockIdp = createMockIdentityProvider({
        authSettings: {
          type: "ENTRA",
          brand: "test-brand",
          clientId: "client-123",
          clientSecret: "secret-123",
          redirectUrls: ["https://example.com/callback"],
          autoLinkUsers: false,
          autoCreateUsers: true
        }
      })
      const mockProfile = {
        identifierClaimValue: "external-id",
        email: "test@example.com",
        givenName: "John",
        surname: "Doe"
      }

      mockUserRepository.tryGetByExternalIdentity.mockResolvedValue(undefined)
      jest.spyOn(User, 'createNew').mockReturnValue(mockNewUser)
      mockNewUser.addIdentity = jest.fn().mockReturnValue(mockNewIdentity)

      const result = await service.authenticateWithExternalIdentity(mockIdp, mockProfile)

      expect(result.user).toBe(mockNewUser)
      expect(result.newIdentity).toBe(mockNewIdentity)
      expect(mockUserRepository.insert).toHaveBeenCalledWith(mockNewUser)
    })

    it("should throw error when user not found and auto-creation disabled", async () => {
      const mockIdp = createMockIdentityProvider()
      const mockProfile = {
        identifierClaimValue: "external-id",
        email: "test@example.com",
        givenName: "John",
        surname: "Doe"
      }

      mockUserRepository.tryGetByExternalIdentity.mockResolvedValue(undefined)

      await expect(service.authenticateWithExternalIdentity(mockIdp, mockProfile))
        .rejects.toThrow(new AuthenticationError(commonErrors.authenticationFailed))
    })

    it("should throw error when user cannot sign in with identity provider", async () => {
      const mockUser = createMockUser({
        canSignInWithIdentityProvider: jest.fn().mockReturnValue(false)
      })
      const mockIdp = createMockIdentityProvider()
      const mockProfile = {
        identifierClaimValue: "external-id",
        email: "test@example.com",
        givenName: "John",
        surname: "Doe"
      }

      mockUserRepository.tryGetByExternalIdentity.mockResolvedValue(mockUser)

      await expect(service.authenticateWithExternalIdentity(mockIdp, mockProfile))
        .rejects.toThrow(new AuthenticationError(commonErrors.authenticationMethodNotAllowed))
    })
  })
})
