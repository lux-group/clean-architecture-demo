import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import * as factories from "@test/factories"
import { mockSigningKeyRepository } from "@test/mocks"
import { SigningKey } from "~/domain/entities"
import { NotFoundError } from "~/domain/errors"
import { RedisSigningKeyRepository } from "../RedisSigningKeyRepository"
import { createRedisTestContext, RedisTestContext } from "./helpers"

describe("RedisSigningKeyRepository", () => {
  let testContext: RedisTestContext
  let redisSigningKeyRepository: RedisSigningKeyRepository
  let mockRepository: typeof mockSigningKeyRepository

  const createSigningKey = (props: Partial<SigningKey> = {}) => {
    return factories.createSigningKey(props)
  }

  beforeAll(async () => {
    testContext = await createRedisTestContext()
    mockRepository = vi.mocked(mockSigningKeyRepository)
    redisSigningKeyRepository = new RedisSigningKeyRepository(
      testContext.redisClient,
      mockRepository
    )
  })

  afterAll(async () => {
    await testContext.destroy()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    // Clear Redis cache before each test
    return testContext.redisClient.flushDb()
  })

  describe("query", () => {
    it("should delegate to underlying repository", async () => {
      const signingKeys = [createSigningKey(), createSigningKey()]
      mockRepository.query.mockResolvedValue(signingKeys)

      const result = await redisSigningKeyRepository.query({ limit: 10, offset: 20 })

      expect(mockRepository.query).toHaveBeenCalledWith({ limit: 10, offset: 20 })
      expect(result).toEqual(signingKeys)
    })
  })

  describe("getById", () => {
    it("should return cached signing key when available", async () => {
      const signingKey = createSigningKey()
      const cacheKey = `signing_key:id:${signingKey.id}`
      
      // Pre-populate cache
      await testContext.redisClient.setEx(
        cacheKey, 
        3600, 
        JSON.stringify({
          ...signingKey.props,
          createdAt: signingKey.props.createdAt.toISOString(),
          updatedAt: signingKey.props.updatedAt.toISOString(),
        })
      )

      const result = await redisSigningKeyRepository.getById(signingKey.id)

      expect(mockRepository.getById).not.toHaveBeenCalled()
      expect(result.id).toBe(signingKey.id)
      expect(result.props).toMatchObject(signingKey.props)
    })

    it("should fetch from repository and cache when not in cache", async () => {
      const signingKey = createSigningKey()
      mockRepository.getById.mockResolvedValue(signingKey)

      const result = await redisSigningKeyRepository.getById(signingKey.id)

      expect(mockRepository.getById).toHaveBeenCalledWith(signingKey.id)
      expect(result).toEqual(signingKey)

      // Verify it was cached
      const cached = await testContext.redisClient.get(`signing_key:id:${signingKey.id}`)
      expect(cached).toBeTruthy()
    })

    it("should throw NotFoundError when signing key not found", async () => {
      mockRepository.getById.mockRejectedValue(new NotFoundError("Signing key not found"))

      await expect(redisSigningKeyRepository.getById("non-existent-id"))
        .rejects
        .toThrow(NotFoundError)
    })
  })

  describe("tryGetById", () => {
    it("should return cached signing key when available", async () => {
      const signingKey = createSigningKey()
      const cacheKey = `signing_key:id:${signingKey.id}`
      
      // Pre-populate cache
      await testContext.redisClient.setEx(
        cacheKey, 
        3600, 
        JSON.stringify({
          ...signingKey.props,
          createdAt: signingKey.props.createdAt.toISOString(),
          updatedAt: signingKey.props.updatedAt.toISOString(),
        })
      )

      const result = await redisSigningKeyRepository.tryGetById(signingKey.id)

      expect(mockRepository.tryGetById).not.toHaveBeenCalled()
      expect(result).toBeDefined()
      expect(result!.id).toBe(signingKey.id)
    })

    it("should fetch from repository and cache when not in cache", async () => {
      const signingKey = createSigningKey()
      mockRepository.tryGetById.mockResolvedValue(signingKey)

      const result = await redisSigningKeyRepository.tryGetById(signingKey.id)

      expect(mockRepository.tryGetById).toHaveBeenCalledWith(signingKey.id)
      expect(result).toEqual(signingKey)

      // Verify it was cached
      const cached = await testContext.redisClient.get(`signing_key:id:${signingKey.id}`)
      expect(cached).toBeTruthy()
    })

    it("should return undefined when signing key not found", async () => {
      mockRepository.tryGetById.mockResolvedValue(undefined)

      const result = await redisSigningKeyRepository.tryGetById("non-existent-id")

      expect(result).toBeUndefined()
    })
  })

  describe("tryGetActiveSigningKey", () => {
    it("should return cached active signing key when available", async () => {
      const signingKey = createSigningKey()
      const cacheKey = `signing_key:active`
      
      // Pre-populate cache
      await testContext.redisClient.setEx(
        cacheKey, 
        3600, 
        JSON.stringify({
          ...signingKey.props,
          createdAt: signingKey.props.createdAt.toISOString(),
          updatedAt: signingKey.props.updatedAt.toISOString(),
        })
      )

      const result = await redisSigningKeyRepository.tryGetActiveSigningKey()

      expect(mockRepository.tryGetActiveSigningKey).not.toHaveBeenCalled()
      expect(result).toBeDefined()
      expect(result!.id).toBe(signingKey.id)
    })

    it("should fetch from repository and cache when not in cache", async () => {
      const signingKey = createSigningKey()
      mockRepository.tryGetActiveSigningKey.mockResolvedValue(signingKey)

      const result = await redisSigningKeyRepository.tryGetActiveSigningKey()

      expect(mockRepository.tryGetActiveSigningKey).toHaveBeenCalled()
      expect(result).toEqual(signingKey)

      // Verify it was cached
      const cached = await testContext.redisClient.get(`signing_key:active`)
      expect(cached).toBeTruthy()
    })

    it("should return undefined when no active signing key found", async () => {
      mockRepository.tryGetActiveSigningKey.mockResolvedValue(undefined)

      const result = await redisSigningKeyRepository.tryGetActiveSigningKey()

      expect(result).toBeUndefined()
    })
  })

  describe("insert", () => {
    it("should delegate to underlying repository and cache the result", async () => {
      const signingKey = createSigningKey()
      mockRepository.insert.mockResolvedValue(signingKey)

      await redisSigningKeyRepository.insert(signingKey)

      expect(mockRepository.insert).toHaveBeenCalledWith(signingKey)

      // Verify it was cached
      const cached = await testContext.redisClient.get(`signing_key:id:${signingKey.id}`)
      expect(cached).toBeTruthy()
    })
  })

  describe("update", () => {
    it("should delegate to underlying repository and update cache", async () => {
      const signingKey = createSigningKey()
      mockRepository.update.mockResolvedValue(signingKey)

      await redisSigningKeyRepository.update(signingKey)

      expect(mockRepository.update).toHaveBeenCalledWith(signingKey)

      // Verify cache was updated (removed and re-added)
      const cached = await testContext.redisClient.get(`signing_key:id:${signingKey.id}`)
      expect(cached).toBeTruthy()
    })
  })

  describe("delete", () => {
    it("should delegate to underlying repository and remove from cache", async () => {
      const signingKey = createSigningKey()
      mockRepository.delete.mockResolvedValue(signingKey)

      // Pre-populate cache
      await testContext.redisClient.setEx(
        `signing_key:id:${signingKey.id}`, 
        3600, 
        "cached-data"
      )
      await testContext.redisClient.setEx(
        `signing_key:active`, 
        3600, 
        "cached-active-data"
      )

      await redisSigningKeyRepository.delete(signingKey)

      expect(mockRepository.delete).toHaveBeenCalledWith(signingKey)

      // Verify cache was cleared (both id and active keys)
      const idCached = await testContext.redisClient.get(`signing_key:id:${signingKey.id}`)
      const activeCached = await testContext.redisClient.get(`signing_key:active`)
      
      expect(idCached).toBeNull()
      expect(activeCached).toBeNull()
    })
  })
}) 