import { vi } from 'vitest';
import {
  AuthClient,
  AuthClientFactory,
  EventPublisher,
  Logger,
  PasswordVerifier,
  TokenIssuer,
  TokenValidator,
} from '~/application/ports';
import {
  IdentityProviderRepository,
  SessionRepository,
  SigningKeyRepository,
  UserRepository,
} from '~/domain/repositories';

export const mockAuthClientFactory = vi.mocked({
  createClient: vi.fn(),
} satisfies AuthClientFactory);

export const mockAuthClient = vi.mocked({
  supportsSignOut: true,
  supportsEditProfile: false,
  createSignInRequest: vi.fn(),
  createSignOutRequest: vi.fn(),
  processSignInResponse: vi.fn(),
  checkSessionWithRefreshToken: vi.fn(),
  editProfile: vi.fn(),
} satisfies AuthClient);

export const mockLogger = vi.mocked({
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
} satisfies Logger);

export const mockEventPublisher = vi.mocked({
  publishEvent: vi.fn(),
} satisfies EventPublisher);

export const mockPasswordVerifier = vi.mocked({
  verifyPassword: vi.fn(),
  createPasswordHash: vi.fn(),
} satisfies PasswordVerifier);

export const mockTokenIssuer = vi.mocked({
  createAccessToken: vi.fn(),
} satisfies TokenIssuer);

export const mockTokenValidator = vi.mocked({
  decodeAndValidateToken: vi.fn(),
} satisfies TokenValidator);

export const mockIdentityProviderRepository = vi.mocked({
  query: vi.fn(),
  getById: vi.fn(),
  tryGetById: vi.fn(),
  tryGetByName: vi.fn(),
  tryGetByIssuerUrlAndAudience: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
} satisfies IdentityProviderRepository);

export const mockSessionRepository = vi.mocked({
  query: vi.fn(),
  getById: vi.fn(),
  tryGetById: vi.fn(),
  tryGetByIdentityProviderSessionId: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
} satisfies SessionRepository);

export const mockSigningKeyRepository = vi.mocked({
  query: vi.fn(),
  getById: vi.fn(),
  tryGetById: vi.fn(),
  tryGetActiveSigningKey: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
} satisfies SigningKeyRepository);

export const mockUserRepository = vi.mocked({
  query: vi.fn(),
  getById: vi.fn(),
  tryGetById: vi.fn(),
  tryGetByBrandAndEmail: vi.fn(),
  tryGetByExternalIdentity: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
  delete: vi.fn(),
} satisfies UserRepository);
