import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import * as factories from "@test/factories"
import { mockIdentityProviderRepository } from "@test/mocks"
import { IdentityProvider, IdentityProviderType } from "~/domain/entities"
import { ConcurrencyError, NotFoundError, ValidationError } from "~/domain/errors"
import { RedisIdentityProviderRepository } from "../RedisIdentityProviderRepository"
import { createRedisTestContext, RedisTestContext } from "./helpers"

describe("RedisIdentityProviderRepository", () => {
  let testContext: RedisTestContext
  let redisIdentityProviderRepository: RedisIdentityProviderRepository
  let mockRepository: typeof mockIdentityProviderRepository

  const createIdentityProvider = (props: Partial<IdentityProvider> = {}) => {
    return factories.createIdentityProvider(props)
  }

  beforeAll(async () => {
    testContext = await createRedisTestContext()
    mockRepository = vi.mocked(mockIdentityProviderRepository)
    redisIdentityProviderRepository = new RedisIdentityProviderRepository(
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
      const identityProviders = [createIdentityProvider(), createIdentityProvider()]
      mockRepository.query.mockResolvedValue(identityProviders)

      const result = await redisIdentityProviderRepository.query()

      expect(mockRepository.query).toHaveBeenCalledWith(undefined, undefined)
      expect(result).toEqual(identityProviders)
    })

    it("should pass offset and limit to underlying repository", async () => {
      const identityProviders = [createIdentityProvider()]
      mockRepository.query.mockResolvedValue(identityProviders)

      const result = await redisIdentityProviderRepository.query(10, 5)

      expect(mockRepository.query).toHaveBeenCalledWith(10, 5)
      expect(result).toEqual(identityProviders)
    })
  })

  describe("getById", () => {
    it("should return cached identity provider when available", async () => {
      const identityProvider = createIdentityProvider()
      const cacheKey = `identity_provider:id:${identityProvider.id}`
      
      // Pre-populate cache
      await testContext.redisClient.setEx(
        cacheKey, 
        3600, 
        JSON.stringify({
          ...identityProvider.props,
          createdAt: identityProvider.props.createdAt.toISOString(),
          updatedAt: identityProvider.props.updatedAt.toISOString(),
        })
      )

      const result = await redisIdentityProviderRepository.getById(identityProvider.id)

      expect(mockRepository.getById).not.toHaveBeenCalled()
      expect(result.id).toBe(identityProvider.id)
      expect(result.props).toMatchObject(identityProvider.props)
    })

    it("should fetch from repository and cache when not in cache", async () => {
      const identityProvider = createIdentityProvider()
      mockRepository.getById.mockResolvedValue(identityProvider)

      const result = await redisIdentityProviderRepository.getById(identityProvider.id)

      expect(mockRepository.getById).toHaveBeenCalledWith(identityProvider.id)
      expect(result).toEqual(identityProvider)

      // Verify it was cached
      const cached = await testContext.redisClient.get(`identity_provider:id:${identityProvider.id}`)
      expect(cached).toBeTruthy()
    })

    it("should throw NotFoundError when identity provider not found", async () => {
      mockRepository.getById.mockRejectedValue(new NotFoundError("Identity provider not found"))

      await expect(redisIdentityProviderRepository.getById("non-existent-id"))
        .rejects
        .toThrow(NotFoundError)
    })
  })

  describe("tryGetById", () => {
    it("should return cached identity provider when available", async () => {
      const identityProvider = createIdentityProvider()
      const cacheKey = `identity_provider:id:${identityProvider.id}`
      
      // Pre-populate cache
      await testContext.redisClient.setEx(
        cacheKey, 
        3600, 
        JSON.stringify({
          ...identityProvider.props,
          createdAt: identityProvider.props.createdAt.toISOString(),
          updatedAt: identityProvider.props.updatedAt.toISOString(),
        })
      )

      const result = await redisIdentityProviderRepository.tryGetById(identityProvider.id)

      expect(mockRepository.tryGetById).not.toHaveBeenCalled()
      expect(result).toBeDefined()
      expect(result!.id).toBe(identityProvider.id)
    })

    it("should fetch from repository and cache when not in cache", async () => {
      const identityProvider = createIdentityProvider()
      mockRepository.tryGetById.mockResolvedValue(identityProvider)

      const result = await redisIdentityProviderRepository.tryGetById(identityProvider.id)

      expect(mockRepository.tryGetById).toHaveBeenCalledWith(identityProvider.id)
      expect(result).toEqual(identityProvider)

      // Verify it was cached
      const cached = await testContext.redisClient.get(`identity_provider:id:${identityProvider.id}`)
      expect(cached).toBeTruthy()
    })

    it("should return undefined when identity provider not found", async () => {
      mockRepository.tryGetById.mockResolvedValue(undefined)

      const result = await redisIdentityProviderRepository.tryGetById("non-existent-id")

      expect(result).toBeUndefined()
    })
  })

  describe("tryGetByName", () => {
    it("should return cached identity provider when available", async () => {
      const identityProvider = createIdentityProvider()
      const cacheKey = `identity_provider:name:${identityProvider.name}`
      
      // Pre-populate cache
      await testContext.redisClient.setEx(
        cacheKey, 
        3600, 
        JSON.stringify({
          ...identityProvider.props,
          createdAt: identityProvider.props.createdAt.toISOString(),
          updatedAt: identityProvider.props.updatedAt.toISOString(),
        })
      )

      const result = await redisIdentityProviderRepository.tryGetByName(identityProvider.name)

      expect(mockRepository.tryGetByName).not.toHaveBeenCalled()
      expect(result).toBeDefined()
      expect(result!.id).toBe(identityProvider.id)
    })

    it("should fetch from repository and cache when not in cache", async () => {
      const identityProvider = createIdentityProvider()
      mockRepository.tryGetByName.mockResolvedValue(identityProvider)

      const result = await redisIdentityProviderRepository.tryGetByName(identityProvider.name)

      expect(mockRepository.tryGetByName).toHaveBeenCalledWith(identityProvider.name)
      expect(result).toEqual(identityProvider)

      // Verify it was cached
      const cached = await testContext.redisClient.get(`identity_provider:name:${identityProvider.name}`)
      expect(cached).toBeTruthy()
    })

    it("should return undefined when identity provider not found by name", async () => {
      mockRepository.tryGetByName.mockResolvedValue(undefined)

      const result = await redisIdentityProviderRepository.tryGetByName("Non-existent Provider")

      expect(result).toBeUndefined()
    })
  })

  describe("tryGetByIssuerUrlAndAudience", () => {
    it("should return cached identity provider when available", async () => {
      const identityProvider = createIdentityProvider()
      const cacheKey = `identity_provider:issuer_audience:${identityProvider.issuerUrl}:${identityProvider.audience}`
      
      // Pre-populate cache
      await testContext.redisClient.setEx(
        cacheKey, 
        3600, 
        JSON.stringify({
          ...identityProvider.props,
          createdAt: identityProvider.props.createdAt.toISOString(),
          updatedAt: identityProvider.props.updatedAt.toISOString(),
        })
      )

      const result = await redisIdentityProviderRepository.tryGetByIssuerUrlAndAudience(
        identityProvider.issuerUrl, 
        identityProvider.audience
      )

      expect(mockRepository.tryGetByIssuerUrlAndAudience).not.toHaveBeenCalled()
      expect(result).toBeDefined()
      expect(result!.id).toBe(identityProvider.id)
    })

    it("should fetch from repository and cache when not in cache", async () => {
      const identityProvider = createIdentityProvider()
      mockRepository.tryGetByIssuerUrlAndAudience.mockResolvedValue(identityProvider)

      const result = await redisIdentityProviderRepository.tryGetByIssuerUrlAndAudience(
        identityProvider.issuerUrl, 
        identityProvider.audience
      )

      expect(mockRepository.tryGetByIssuerUrlAndAudience).toHaveBeenCalledWith(
        identityProvider.issuerUrl, 
        identityProvider.audience
      )
      expect(result).toEqual(identityProvider)

      // Verify it was cached
      const cached = await testContext.redisClient.get(
        `identity_provider:issuer_audience:${identityProvider.issuerUrl}:${identityProvider.audience}`
      )
      expect(cached).toBeTruthy()
    })

    it("should return undefined when identity provider not found", async () => {
      mockRepository.tryGetByIssuerUrlAndAudience.mockResolvedValue(undefined)

      const result = await redisIdentityProviderRepository.tryGetByIssuerUrlAndAudience(
        "https://nonexistent.example.com", 
        "nonexistent-audience"
      )

      expect(result).toBeUndefined()
    })
  })

  describe("insert", () => {
    it("should delegate to underlying repository and cache the result", async () => {
      const identityProvider = createIdentityProvider()
      mockRepository.insert.mockResolvedValue(identityProvider)

      await redisIdentityProviderRepository.insert(identityProvider)

      expect(mockRepository.insert).toHaveBeenCalledWith(identityProvider)

      // Verify it was cached with all keys
      const idCached = await testContext.redisClient.get(`identity_provider:id:${identityProvider.id}`)
      const nameCached = await testContext.redisClient.get(`identity_provider:name:${identityProvider.name}`)
      const issuerAudienceCached = await testContext.redisClient.get(
        `identity_provider:issuer_audience:${identityProvider.issuerUrl}:${identityProvider.audience}`
      )
      
      expect(idCached).toBeTruthy()
      expect(nameCached).toBeTruthy()
      expect(issuerAudienceCached).toBeTruthy()
    })

    it("should throw ValidationError when underlying repository throws", async () => {
      const identityProvider = createIdentityProvider()
      mockRepository.insert.mockRejectedValue(new ValidationError("Duplicate entry"))

      await expect(redisIdentityProviderRepository.insert(identityProvider))
        .rejects
        .toThrow(ValidationError)
    })
  })

  describe("update", () => {
    it("should delegate to underlying repository and update cache", async () => {
      const identityProvider = createIdentityProvider()
      mockRepository.update.mockResolvedValue(identityProvider)

      await redisIdentityProviderRepository.update(identityProvider)

      expect(mockRepository.update).toHaveBeenCalledWith(identityProvider)

      // Verify cache was updated (removed and re-added)
      const idCached = await testContext.redisClient.get(`identity_provider:id:${identityProvider.id}`)
      const nameCached = await testContext.redisClient.get(`identity_provider:name:${identityProvider.name}`)
      const issuerAudienceCached = await testContext.redisClient.get(
        `identity_provider:issuer_audience:${identityProvider.issuerUrl}:${identityProvider.audience}`
      )
      
      expect(idCached).toBeTruthy()
      expect(nameCached).toBeTruthy()
      expect(issuerAudienceCached).toBeTruthy()
    })

    it("should throw ConcurrencyError when underlying repository throws", async () => {
      const identityProvider = createIdentityProvider()
      mockRepository.update.mockRejectedValue(new ConcurrencyError("Version mismatch"))

      await expect(redisIdentityProviderRepository.update(identityProvider))
        .rejects
        .toThrow(ConcurrencyError)
    })
  })

  describe("delete", () => {
    it("should delegate to underlying repository and remove from cache", async () => {
      const identityProvider = createIdentityProvider()
      mockRepository.delete.mockResolvedValue(identityProvider)

      // Pre-populate cache
      await testContext.redisClient.setEx(
        `identity_provider:id:${identityProvider.id}`, 
        3600, 
        "cached-data"
      )

      await redisIdentityProviderRepository.delete(identityProvider)

      expect(mockRepository.delete).toHaveBeenCalledWith(identityProvider)

      // Verify cache was cleared
      const idCached = await testContext.redisClient.get(`identity_provider:id:${identityProvider.id}`)
      const nameCached = await testContext.redisClient.get(`identity_provider:name:${identityProvider.name}`)
      const issuerAudienceCached = await testContext.redisClient.get(
        `identity_provider:issuer_audience:${identityProvider.issuerUrl}:${identityProvider.audience}`
      )
      
      expect(idCached).toBeNull()
      expect(nameCached).toBeNull()
      expect(issuerAudienceCached).toBeNull()
    })
  })
}) 