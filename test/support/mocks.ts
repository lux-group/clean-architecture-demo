import { IdentityProviderRepository, SessionRepository, SigningKeyRepository, UserRepository } from "~/domain/repositories"
import { AuthClient, AuthClientFactory, EventPublisher, PasswordVerifier, TokenIssuer, TokenValidator } from "~/domain/adapters"

export const mockIdentityProviderRepository = {
  query: jest.fn(),
  getById: jest.fn(),
  tryGetById: jest.fn(),
  tryGetByName: jest.fn(),
  tryGetByIssuerUrlAndAudience: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
} as jest.Mocked<IdentityProviderRepository>

export const mockSessionRepository = {
  query: jest.fn(),
  getById: jest.fn(),
  tryGetById: jest.fn(),
  tryGetByIdentityProviderSessionId: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
} as jest.Mocked<SessionRepository>

export const mockSigningKeyRepository = {
  query: jest.fn(),
  getById: jest.fn(),
  tryGetById: jest.fn(),
  tryGetActiveSigningKey: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
} as jest.Mocked<SigningKeyRepository>

export const mockUserRepository = {
  query: jest.fn(),
  getById: jest.fn(),
  tryGetById: jest.fn(),
  tryGetByBrandAndEmail: jest.fn(),
  tryGetByExternalIdentity: jest.fn(),
  update: jest.fn(),
  insert: jest.fn(),
  delete: jest.fn(),
} as jest.Mocked<UserRepository>

export const mockEventPublisher = {
  publishEvent: jest.fn(),
} as jest.Mocked<EventPublisher>

export const mockPasswordVerifier = {
  verifyPassword: jest.fn(),
  createPasswordHash: jest.fn(),
} as jest.Mocked<PasswordVerifier>

export const mockTokenIssuer = {
  createAccessToken: jest.fn(),
} as jest.Mocked<TokenIssuer>

export const mockTokenValidator = {
  decodeAndValidateToken: jest.fn(),
} as jest.Mocked<TokenValidator>

export const mockAuthClientFactory = {
  createClient: jest.fn(),
} as jest.Mocked<AuthClientFactory>

export const mockAuthClient = {
  supportsSignOut: true,
  supportsEditProfile: false,
  createSignInRequest: jest.fn(),
  createSignOutRequest: jest.fn(),
  processSignInResponse: jest.fn(),
  checkSessionWithRefreshToken: jest.fn(),
  editProfile: jest.fn(),
} as jest.Mocked<AuthClient>
