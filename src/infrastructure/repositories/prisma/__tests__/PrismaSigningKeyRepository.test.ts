import { afterAll, beforeAll, describe, expect, it } from "vitest"
import * as factories from "@test/factories"
import { SigningKey } from "~/domain/entities"
import { ConcurrencyError, NotFoundError } from "~/domain/errors"
import { PrismaSigningKeyRepository } from "../PrismaSigningKeyRepository"
import { createPrismaTestContext, PrismaTestContext } from "./helpers"

describe("PrismaSigningKeyRepository", () => {
  let testContext: PrismaTestContext
  let signingKeyRepository: PrismaSigningKeyRepository

  const createSigningKey = async (props: Partial<SigningKey> = {}): Promise<SigningKey> => {
    const signingKey = factories.createSigningKey(props)
    await signingKeyRepository.insert(signingKey)
    return signingKey
  }

  beforeAll(async () => {
    testContext = await createPrismaTestContext()
    signingKeyRepository = new PrismaSigningKeyRepository(testContext.prismaClient, testContext.encryptionProvider)
  })

  afterAll(async () => {
    await testContext.destroy()
  })

  describe("query", () => {
    it("should return all signing keys", async () => {
      await createSigningKey()

      const found = await signingKeyRepository.query({ limit: 10, offset: 0 })
      
      expect(found.items.length).toBeGreaterThanOrEqual(1)
    })

    it("should return filtered signing keys", async () => {
      const original = await createSigningKey()

      const found = await signingKeyRepository.query({
        limit: 10,
        offset: 0,
        orderBy: { property: "id", direction: "asc" },
        where: { property: "id", operator: "equals", value: original.id }
      })

      expect(found.items.length).toBe(1)
      expect(found.items[0].id).toBe(original.id)
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

      const rawKey = await testContext.prismaClient.$primary().signingKey.findUnique({ where: { id: original.id } })
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

