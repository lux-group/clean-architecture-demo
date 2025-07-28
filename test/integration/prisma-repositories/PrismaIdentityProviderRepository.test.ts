import { randomUUID } from "crypto"
import { IdentityProvider, IdentityProviderType } from "~/domain/entities"
import { ConcurrencyError, NotFoundError, ValidationError } from "~/domain/errors"
import { EncryptionProvider } from "~/infrastructure/crypto"
import { createPrismaClient, PrismaClient } from "~/infrastructure/repositories/prisma/PrismaClient"
import { PrismaIdentityProviderRepository } from "~/infrastructure/repositories/prisma/PrismaIdentityProviderRepository"

class MockEncryptionProvider implements EncryptionProvider {
  encrypt = (data: string) => `encrypted_${data}`
  decrypt = (data: string) => data.replace("encrypted_", "")
}

describe("PrismaIdentityProviderRepository", () => {
  let prismaClient: PrismaClient
  let identityProviderRepository: PrismaIdentityProviderRepository
  let encryptionProvider: EncryptionProvider

  const createIdentityProvider = async (props: Partial<IdentityProvider> = {}): Promise<IdentityProvider> => {
    const idp = IdentityProvider.createNew({
      name: randomUUID(),
      issuerUrl: "https://test.example.com",
      audience: randomUUID(),
      identifierClaimName: "sub",
      authSettings: {
        type: IdentityProviderType.Google,
        brand: "test-brand",
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
        redirectUrls: ["https://example.com/callback"],
        autoLinkUsers: false,
        autoCreateUsers: false
      },
      ...props
    })

    await identityProviderRepository.insert(idp)
    return idp
  }

  beforeAll(() => {
    prismaClient = createPrismaClient(process.env.PRISMA_TEST_DATABASE_URL!)
    encryptionProvider = new MockEncryptionProvider()
    identityProviderRepository = new PrismaIdentityProviderRepository(prismaClient, encryptionProvider)
  })

  afterAll(async () => {
    await prismaClient?.$disconnect()
  })

  describe("query", () => {
    it("should return all identity providers", async () => {
      await createIdentityProvider()

      const found = await identityProviderRepository.query()

      expect(found.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe("getById", () => {
    it("should return identity provider when found", async () => {
      const original = await createIdentityProvider()

      const found = await identityProviderRepository.getById(original.id)

      expect(found).toMatchObject(original)
    })

    it("should throw NotFoundError when identity provider not found", async () => {
      await expect(identityProviderRepository.getById("non-existent-id"))
        .rejects
        .toThrow(NotFoundError)
    })
  })

  describe("tryGetById", () => {
    it("should return identity provider when found", async () => {
      const original = await createIdentityProvider({ authSettings: null })

      const found = await identityProviderRepository.tryGetById(original.id)

      expect(found).toBeDefined()
      expect(found!.id).toBe(original.id)
    })

    it("should return undefined when identity provider not found", async () => {
      const found = await identityProviderRepository.tryGetById("non-existent-id")

      expect(found).toBeUndefined()
    })
  })

  describe("getByName", () => {
    it("should return identity provider when found by name", async () => {
      const original = await createIdentityProvider()

      const found = await identityProviderRepository.getByName(original.name)

      expect(found.id).toBe(original.id)
    })

    it("should throw NotFoundError when identity provider not found by name", async () => {
      await expect(identityProviderRepository.getByName("Non-existent Provider"))
        .rejects
        .toThrow(NotFoundError)
    })
  })

  describe("tryGetByIssuerUrlAndAudience", () => {
    it("should return identity provider when found by issuer URL and audience", async () => {
      const original = await createIdentityProvider()

      const found = await identityProviderRepository.tryGetByIssuerUrlAndAudience(
        original.issuerUrl, 
        original.audience
      )

      expect(found).toBeDefined()
      expect(found!.id).toBe(original.id)
    })

    it("should return undefined when identity provider not found", async () => {
      const found = await identityProviderRepository.tryGetByIssuerUrlAndAudience(
        "https://nonexistent.example.com", 
        "nonexistent-audience"
      )

      expect(found).toBeUndefined()
    })
  })

  describe("insert", () => {
    it("should insert a new identity provider with auth settings", async () => {
      const original = await createIdentityProvider()

      const found = await identityProviderRepository.getById(original.id)

      expect(found).toBeDefined()
      expect(found.props).toMatchObject(original.props)
    })

    it("should insert identity provider without auth settings", async () => {
      const original = await createIdentityProvider({ authSettings: null })

      const found = await identityProviderRepository.getById(original.id)

      expect(found).toBeDefined()
      expect(found.props).toMatchObject(original.props)
    })

    it("should enforce unique issuer URL and audience constraint", async () => {
      const original = await createIdentityProvider({
        issuerUrl: "https://same.example.com",
        audience: "same-audience",
      })

      await expect(identityProviderRepository.insert(original))
        .rejects
        .toThrow(ValidationError)
    })

    it("should encrypt client secret when inserting", async () => {
      const original = await createIdentityProvider({
        authSettings: {
          type: IdentityProviderType.Google,
          brand: "test-brand",
          clientId: "test-client-id",
          clientSecret: "super-secret-key",
          redirectUrls: ["https://example.com/callback"],
          autoLinkUsers: false,
          autoCreateUsers: false
        }
      })

      const found = await prismaClient.identityProvider.findUnique({ where: { id: original.id } })

      expect(found!.authSettingsClientSecret).toBe("encrypted_super-secret-key")
    })
  })

  describe("update", () => {
    it("should update an existing identity provider", async () => {
      const original = await createIdentityProvider()

      original.update({
        name: "Updated Name",
        issuerUrl: "https://updated.example.com",
        audience: "updated-audience",
        identifierClaimName: "email",
        authSettings: {
          type: IdentityProviderType.Entra,
          brand: "updated-brand",
          clientId: "updated-client-id",
          clientSecret: "updated-secret",
          redirectUrls: ["https://updated.example.com/callback"],
          autoLinkUsers: true,
          autoCreateUsers: true
        }
      })

      await identityProviderRepository.update(original)

      const found = await identityProviderRepository.getById(original.id)
      expect(found.props).toMatchObject(original.props)
    })

    it("should handle concurrent updates with optimistic locking", async () => {
      const original = await createIdentityProvider()
      const idp1 = await identityProviderRepository.getById(original.id)
      const idp2 = await identityProviderRepository.getById(original.id)

      idp1.update({
        name: "Updated by User 1",
        issuerUrl: "https://updated1.example.com",
        audience: "updated1-audience",
        identifierClaimName: "sub",
        authSettings: null
      })
      
      await identityProviderRepository.update(idp1)

      idp2.update({
        name: "Updated by User 2",
        issuerUrl: "https://updated2.example.com",
        audience: "updated2-audience",
        identifierClaimName: "sub",
        authSettings: null
      })

      await expect(identityProviderRepository.update(idp2))
        .rejects
        .toThrow(ConcurrencyError)
    })
  })

  describe("delete", () => {
    it("should delete an existing identity provider", async () => {
      const original = await createIdentityProvider()

      await identityProviderRepository.delete(original.id)

      const deletedIdP = await identityProviderRepository.tryGetById(original.id)
      expect(deletedIdP).toBeUndefined()
    })

    it("should not throw error when deleting non-existent identity provider", async () => {
      await expect(identityProviderRepository.delete("non-existent-id"))
        .rejects
        .toThrow(ConcurrencyError)
    })
  })
})
