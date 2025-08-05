import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import * as factories from "@test/factories"
import { mockSessionRepository } from "@test/mocks"
import { Session } from "~/domain/entities"
import { NotFoundError } from "~/domain/errors"
import { RedisSessionRepository } from "../RedisSessionRepository"
import { createRedisTestContext, RedisTestContext } from "./helpers"

describe("RedisSessionRepository", () => {
  let testContext: RedisTestContext
  let redisSessionRepository: RedisSessionRepository
  let mockRepository: typeof mockSessionRepository

  const createLocalSession = (props: Partial<Session> = {}) => {
    return factories.createLocalSession(props)
  }

  const createIdentityProviderSession = (props: Partial<Session> = {}) => {
    return factories.createIdentityProviderSession(props)
  }

  beforeAll(async () => {
    testContext = await createRedisTestContext()
    mockRepository = vi.mocked(mockSessionRepository)
    redisSessionRepository = new RedisSessionRepository(
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
      const sessions = [createLocalSession(), createIdentityProviderSession()]
      mockRepository.query.mockResolvedValue(sessions)

      const result = await redisSessionRepository.query()

      expect(mockRepository.query).toHaveBeenCalledWith(undefined, undefined)
      expect(result).toEqual(sessions)
    })

    it("should pass offset and limit to underlying repository", async () => {
      const sessions = [createLocalSession()]
      mockRepository.query.mockResolvedValue(sessions)

      const result = await redisSessionRepository.query(10, 5)

      expect(mockRepository.query).toHaveBeenCalledWith(10, 5)
      expect(result).toEqual(sessions)
    })
  })

  describe("getById", () => {
    it("should return cached session when available", async () => {
      const session = createLocalSession()
      const cacheKey = `session:id:${session.id}`
      
      // Pre-populate cache
      await testContext.redisClient.setEx(
        cacheKey, 
        3600, 
        JSON.stringify({
          ...session.props,
          createdAt: session.props.createdAt.toISOString(),
          updatedAt: session.props.updatedAt.toISOString(),
          expiresAt: session.props.expiresAt.toISOString(),
          lastRefreshAt: session.props.lastRefreshAt.toISOString(),
          terminatedAt: session.props.terminatedAt ? session.props.terminatedAt.toISOString() : null,
        })
      )

      const result = await redisSessionRepository.getById(session.id)

      expect(mockRepository.getById).not.toHaveBeenCalled()
      expect(result.id).toBe(session.id)
      expect(result.props).toMatchObject(session.props)
    })

    it("should fetch from repository and cache when not in cache", async () => {
      const session = createLocalSession()
      mockRepository.getById.mockResolvedValue(session)

      const result = await redisSessionRepository.getById(session.id)

      expect(mockRepository.getById).toHaveBeenCalledWith(session.id)
      expect(result).toEqual(session)

      // Verify it was cached
      const cached = await testContext.redisClient.get(`session:id:${session.id}`)
      expect(cached).toBeTruthy()
    })

    it("should throw NotFoundError when session not found", async () => {
      mockRepository.getById.mockRejectedValue(new NotFoundError("Session not found"))

      await expect(redisSessionRepository.getById("non-existent-id"))
        .rejects
        .toThrow(NotFoundError)
    })
  })

  describe("tryGetById", () => {
    it("should return cached session when available", async () => {
      const session = createLocalSession()
      const cacheKey = `session:id:${session.id}`
      
      // Pre-populate cache
      await testContext.redisClient.setEx(
        cacheKey, 
        3600, 
        JSON.stringify({
          ...session.props,
          createdAt: session.props.createdAt.toISOString(),
          updatedAt: session.props.updatedAt.toISOString(),
          expiresAt: session.props.expiresAt.toISOString(),
          lastRefreshAt: session.props.lastRefreshAt.toISOString(),
          terminatedAt: session.props.terminatedAt ? session.props.terminatedAt.toISOString() : null,
        })
      )

      const result = await redisSessionRepository.tryGetById(session.id)

      expect(mockRepository.tryGetById).not.toHaveBeenCalled()
      expect(result).toBeDefined()
      expect(result!.id).toBe(session.id)
    })

    it("should fetch from repository and cache when not in cache", async () => {
      const session = createLocalSession()
      mockRepository.tryGetById.mockResolvedValue(session)

      const result = await redisSessionRepository.tryGetById(session.id)

      expect(mockRepository.tryGetById).toHaveBeenCalledWith(session.id)
      expect(result).toEqual(session)

      // Verify it was cached
      const cached = await testContext.redisClient.get(`session:id:${session.id}`)
      expect(cached).toBeTruthy()
    })

    it("should return undefined when session not found", async () => {
      mockRepository.tryGetById.mockResolvedValue(undefined)

      const result = await redisSessionRepository.tryGetById("non-existent-id")

      expect(result).toBeUndefined()
    })
  })

  describe("tryGetByIdentityProviderSessionId", () => {
    it("should delegate to underlying repository", async () => {
      const session = createIdentityProviderSession()
      mockRepository.tryGetByIdentityProviderSessionId.mockResolvedValue(session)

      const result = await redisSessionRepository.tryGetByIdentityProviderSessionId("provider-session-id")

      expect(mockRepository.tryGetByIdentityProviderSessionId).toHaveBeenCalledWith("provider-session-id")
      expect(result).toEqual(session)
    })

    it("should return undefined when session not found", async () => {
      mockRepository.tryGetByIdentityProviderSessionId.mockResolvedValue(undefined)

      const result = await redisSessionRepository.tryGetByIdentityProviderSessionId("non-existent-provider-session-id")

      expect(result).toBeUndefined()
    })
  })

  describe("insert", () => {
    it("should delegate to underlying repository and cache the result", async () => {
      const session = createLocalSession()
      mockRepository.insert.mockResolvedValue(session)

      await redisSessionRepository.insert(session)

      expect(mockRepository.insert).toHaveBeenCalledWith(session)

      // Verify it was cached
      const cached = await testContext.redisClient.get(`session:id:${session.id}`)
      expect(cached).toBeTruthy()
    })
  })

  describe("update", () => {
    it("should delegate to underlying repository and update cache", async () => {
      const session = createLocalSession()
      mockRepository.update.mockResolvedValue(session)

      await redisSessionRepository.update(session)

      expect(mockRepository.update).toHaveBeenCalledWith(session)

      // Verify cache was updated (removed and re-added)
      const cached = await testContext.redisClient.get(`session:id:${session.id}`)
      expect(cached).toBeTruthy()
    })
  })

  describe("delete", () => {
    it("should delegate to underlying repository and remove from cache", async () => {
      const session = createLocalSession()
      mockRepository.delete.mockResolvedValue(session)

      // Pre-populate cache
      await testContext.redisClient.setEx(
        `session:id:${session.id}`, 
        3600, 
        "cached-data"
      )

      await redisSessionRepository.delete(session)

      expect(mockRepository.delete).toHaveBeenCalledWith(session)

      // Verify cache was cleared
      const cached = await testContext.redisClient.get(`session:id:${session.id}`)
      expect(cached).toBeNull()
    })
  })
}) 