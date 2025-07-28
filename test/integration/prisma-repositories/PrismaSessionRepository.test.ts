import { randomUUID } from "node:crypto"
import { Session } from "~/domain/entities"
import { ConcurrencyError, NotFoundError } from "~/domain/errors"
import { EncryptionProvider } from "~/infrastructure/crypto"
import { createPrismaClient, PrismaClient } from "~/infrastructure/repositories/prisma/PrismaClient"
import { PrismaSessionRepository } from "~/infrastructure/repositories/prisma/PrismaSessionRepository"

class MockEncryptionProvider implements EncryptionProvider {
  encrypt = (data: string) => `encrypted_${data}`
  decrypt = (data: string) => data.replace("encrypted_", "")
}

describe("PrismaSessionRepository", () => {
  let prismaClient: PrismaClient
  let sessionRepository: PrismaSessionRepository
  let encryptionProvider: EncryptionProvider
  let identityProviderId: string
  let userId: string

  const createSession = async (props: Partial<Session> = {}): Promise<Session> => {
    const session = Session.createNew({
      userId,
      identityProviderId,
      identityProviderSessionId: randomUUID(),
      idToken: "test-id-token",
      refreshToken: "test-refresh-token",
      ...props
    }, 1)

    await sessionRepository.insert(session)
    return session
  }

  beforeAll(async () => {
    prismaClient = createPrismaClient(process.env.PRISMA_TEST_DATABASE_URL!)
    encryptionProvider = new MockEncryptionProvider()
    sessionRepository = new PrismaSessionRepository(prismaClient, encryptionProvider)

    identityProviderId = randomUUID()
    userId = randomUUID()

    await prismaClient.identityProvider.create({
      data: {
        id: identityProviderId,
        name: randomUUID(),
        issuerUrl: "https://test.example.com",
        audience: randomUUID(),
        identifierClaimName: "sub",
      }
    })

    await prismaClient.user.create({
      data: {
        id: userId,
        isEnabled: true,
        brand: "test-brand",
        givenName: "John",
        surname: "Doe",
        email: randomUUID() + "@john.doe.",
        emailVerified: true,
      }
    })
  })

  afterAll(async () => {
    await prismaClient?.$disconnect()
  })

  describe("query", () => {
    it("should return all sessions", async () => {
      const original = await createSession()

      const found = await sessionRepository.query()

      expect(found.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe("getById", () => {
    it("should return session when found", async () => {
      const original = await createSession()

      const found = await sessionRepository.getById(original.id)

      expect(found.id).toBe(original.id)
    })

    it("should throw NotFoundError when session not found", async () => {
      await expect(sessionRepository.getById("non-existent-id"))
        .rejects
        .toThrow(NotFoundError)
    })
  })

  describe("tryGetById", () => {
    it("should return session when found", async () => {
      const original = await createSession()

      const found = await sessionRepository.tryGetById(original.id)

      expect(found).toBeDefined()
      expect(found!.id).toBe(original.id)
    })

    it("should return undefined when session not found", async () => {
      const found = await sessionRepository.tryGetById("non-existent-id")

      expect(found).toBeUndefined()
    })
  })

  describe("tryGetByIdentityProviderSessionId", () => {
    it("should return session when found by identity provider session id", async () => {
      const original = await createSession()

      const found = await sessionRepository.tryGetByIdentityProviderSessionId(original.identityProviderSessionId!)

      expect(found).toBeDefined()
      expect(found!.identityProviderSessionId).toBe(original.identityProviderSessionId)
    })

    it("should return undefined when session not found", async () => {
      const found = await sessionRepository.tryGetByIdentityProviderSessionId("non-existent-id")

      expect(found).toBeUndefined()
    })
  })

  describe("insert", () => {
    it("should insert a new session", async () => {
      const original = await createSession()

      const found = await sessionRepository.getById(original.id)
      expect(found.props).toMatchObject(original.props)
    })

    it("should encrypt refresh token when inserting", async () => {
      const original = await createSession()

      const rawSession = await prismaClient.session.findUnique({ where: { id: original.id } })
      expect(rawSession!.refreshToken).toMatch(/^encrypted_/)
    })
  })

  describe("update", () => {
    it("should update an existing session", async () => {
      const original = await createSession()

      original.setLastRefresh("new-id-token", "new-refresh-token")

      await sessionRepository.update(original)

      const updatedSession = await sessionRepository.getById(original.id)
      expect(updatedSession.props).toMatchObject(original.props)
    })

    it("should handle concurrent updates with optimistic locking", async () => {
      const original = await createSession()

      const session1 = await sessionRepository.getById(original.id)
      const session2 = await sessionRepository.getById(original.id)

      session1.setLastRefresh("token1")
      await sessionRepository.update(session1)

      session2.setLastRefresh("token2")

      await expect(sessionRepository.update(session2))
        .rejects
        .toThrow(ConcurrencyError)
    })
  })
})
