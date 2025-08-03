import * as factories from "@test/factories"
import { IdentityProvider, IdentityProviderType } from "~/domain/entities"
import { ConcurrencyError, NotFoundError, ValidationError } from "~/domain/errors"
import { PrismaIdentityProviderRepository } from "../PrismaIdentityProviderRepository"
import { createPrismaTestContext, PrismaTestContext } from "./helpers"

describe("PrismaIdentityProviderRepository", () => {
  let testContext: PrismaTestContext
  let identityProviderRepository: PrismaIdentityProviderRepository

  const createAndStoreIdentityProvider = async (props: Partial<IdentityProvider> = {}) => {
    const identityProvider =  factories.createIdentityProvider(props)
    await identityProviderRepository.insert(identityProvider)
    return identityProvider
  }

  beforeAll(async () => {
    testContext = await createPrismaTestContext()
    identityProviderRepository = new PrismaIdentityProviderRepository(testContext.prismaClient, testContext.encryptionProvider)
  })

  afterAll(async () => {
    await testContext.destroy()
  })

  describe("query", () => {
    it("should return all identity providers", async () => {
      await createAndStoreIdentityProvider()

      const found = await identityProviderRepository.query()

      expect(found.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe("getById", () => {
    it("should return identity provider when found", async () => {
      const original = await createAndStoreIdentityProvider()

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
      const original = await createAndStoreIdentityProvider({ authSettings: null })

      const found = await identityProviderRepository.tryGetById(original.id)

      expect(found).toBeDefined()
      expect(found!.id).toBe(original.id)
    })

    it("should return undefined when identity provider not found", async () => {
      const found = await identityProviderRepository.tryGetById("non-existent-id")

      expect(found).toBeUndefined()
    })
  })

  describe("tryGetByName", () => {
    it("should return identity provider when found by name", async () => {
      const original = await createAndStoreIdentityProvider()

      const found = await identityProviderRepository.tryGetByName(original.name)

      expect(found).toBeDefined()
      expect(found!.id).toBe(original.id)
    })

    it("should throw NotFoundError when identity provider not found by name", async () => {
      await expect(identityProviderRepository.tryGetByName("Non-existent Provider"))
        .resolves
        .toBeUndefined()
    })
  })

  describe("tryGetByIssuerUrlAndAudience", () => {
    it("should return identity provider when found by issuer URL and audience", async () => {
      const original = await createAndStoreIdentityProvider()

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
      const original = await createAndStoreIdentityProvider()

      const found = await identityProviderRepository.getById(original.id)

      expect(found).toBeDefined()
      expect(found.props).toMatchObject(original.props)
    })

    it("should insert identity provider without auth settings", async () => {
      const original = await createAndStoreIdentityProvider({ authSettings: null })

      const found = await identityProviderRepository.getById(original.id)

      expect(found).toBeDefined()
      expect(found.props).toMatchObject(original.props)
    })

    it("should enforce unique issuer URL and audience constraint", async () => {
      const original = await createAndStoreIdentityProvider({
        issuerUrl: "https://same.example.com",
        audience: "same-audience",
      })

      await expect(identityProviderRepository.insert(original))
        .rejects
        .toThrow(ValidationError)
    })

    it("should encrypt client secret when inserting", async () => {
      const original = await createAndStoreIdentityProvider()

      const found = await testContext.prismaClient.identityProvider.findUnique({ where: { id: original.id } })

      expect(found!.authSettingsClientSecret).toBe("encrypted_" + original.authSettings!.clientSecret)
    })
  })

  describe("update", () => {
    it("should update an existing identity provider", async () => {
      const original = await createAndStoreIdentityProvider()

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
      const original = await createAndStoreIdentityProvider()
      const idp1 = new IdentityProvider({ ...original.props });
      const idp2 = new IdentityProvider({ ...original.props });

      idp1.update({
        name: "Updated by User 1",
        issuerUrl: idp1.issuerUrl,
        audience: idp1.audience,
        identifierClaimName: idp1.identifierClaimName,
        authSettings: null
      })

      idp2.update({
        name: "Updated by User 2",
        issuerUrl: idp2.issuerUrl,
        audience: idp2.audience,
        identifierClaimName: idp2.identifierClaimName,
        authSettings: null
      })

      await identityProviderRepository.update(idp1)

      await expect(identityProviderRepository.update(idp2))
        .rejects
        .toThrow(ConcurrencyError)
    })
  })

  describe("delete", () => {
    it("should delete an existing identity provider", async () => {
      const original = await createAndStoreIdentityProvider()

      await identityProviderRepository.delete(original)

      const deletedIdP = await identityProviderRepository.tryGetById(original.id)
      expect(deletedIdP).toBeUndefined()
    })
  })
})

