import { SigningKey } from "~/domain/entities"
import { ConcurrencyError, NotFoundError } from "~/domain/errors"
import { EncryptionProvider } from "~/infrastructure/crypto"
import { createPrismaClient, PrismaClient } from "~/infrastructure/repositories/prisma/PrismaClient"
import { PrismaSigningKeyRepository } from "~/infrastructure/repositories/prisma/PrismaSigningKeyRepository"

class MockEncryptionProvider implements EncryptionProvider {
  encrypt = (data: string) => `encrypted_${data}`
  decrypt = (data: string) => data.replace("encrypted_", "")
}

describe("PrismaSigningKeyRepository", () => {
  let prismaClient: PrismaClient
  let signingKeyRepository: PrismaSigningKeyRepository
  let encryptionProvider: EncryptionProvider

  const createSigningKey = async (props: Partial<SigningKey> = {}): Promise<SigningKey> => {
    const signingKey = SigningKey.createNew({
        publicKey: "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----",
        privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQD...\n-----END PRIVATE KEY-----",
        ...props
      })

    await signingKeyRepository.insert(signingKey)
    return signingKey
  }

  beforeAll(() => {
    prismaClient = createPrismaClient(process.env.PRISMA_TEST_DATABASE_URL!)
    encryptionProvider = new MockEncryptionProvider()
    signingKeyRepository = new PrismaSigningKeyRepository(prismaClient, encryptionProvider)
  })

  afterAll(async () => {
    await prismaClient?.$disconnect()
  })

  describe("query", () => {
    it("should return all signing keys", async () => {
      await createSigningKey()

      const found = await signingKeyRepository.query()

      expect(found.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe("getById", () => {
    it("should return signing key when found", async () => {
      const original = await createSigningKey()

      const found = await signingKeyRepository.getById(original.id)

      expect(found.id).toBe(original.id)
    })

    it("should throw NotFoundError when signing key not found", async () => {
      await expect(signingKeyRepository.getById("non-existent-id"))
        .rejects
        .toThrow(NotFoundError)
    })
  })

  describe("tryGetById", () => {
    it("should return signing key when found", async () => {
      const original = await createSigningKey()

      const found = await signingKeyRepository.tryGetById(original.id)

      expect(found).toBeDefined()
      expect(found!.id).toBe(original.id)
    })

    it("should return undefined when signing key not found", async () => {
      const found = await signingKeyRepository.tryGetById("non-existent-id")

      expect(found).toBeUndefined()
    })
  })

  describe("tryGetActiveSigningKey", () => {
    it("should return active signing key when one exists", async () => {
      const original = await createSigningKey()

      const found = await signingKeyRepository.tryGetActiveSigningKey()

      expect(found).toBeDefined()
      expect(found!.id).toBe(original.id)
    })
  })

  describe("insert", () => {
    it("should insert a new signing key", async () => {
      const original = await createSigningKey()

      const found = await signingKeyRepository.getById(original.id)
      expect(found.props).toMatchObject(original.props)
    })

    it("should encrypt private key when inserting", async () => {
      const original = await createSigningKey()

      const rawKey = await prismaClient.signingKey.findUnique({ where: { id: original.id } })
      expect(rawKey!.privateKey).toMatch(/^encrypted_/)
    })
  })

  describe("update", () => {
    it("should update an existing signing key", async () => {
      const original = await createSigningKey()
      original.deactivate()

      await signingKeyRepository.update(original)

      const found = await signingKeyRepository.getById(original.id)
      expect(found.privateKey).toBeNull()
      expect(found.updatedAt.getTime()).toBeGreaterThan(found.createdAt.getTime())
    })

    it("should handle concurrent updates with optimistic locking", async () => {
      const original = await createSigningKey()

      const key1 = await signingKeyRepository.getById(original.id)
      key1.deactivate()

      const key2 = await signingKeyRepository.getById(original.id)
      key2.deactivate()

      await signingKeyRepository.update(key1)

      await expect(signingKeyRepository.update(key2))
        .rejects
        .toThrow(ConcurrencyError)
    })
  })

  describe("delete", () => {
    it("should delete an inactive signing key", async () => {
      const original = await createSigningKey({ privateKey: null })

      await signingKeyRepository.delete(original)

      const deletedKey = await signingKeyRepository.tryGetById(original.id)
      expect(deletedKey).toBeUndefined()
    })
  })
})
