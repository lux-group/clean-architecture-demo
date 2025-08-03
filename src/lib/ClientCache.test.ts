import { ClientCache } from "./ClientCache"

type TestEntity = { id: string, updatedAt: Date }

describe("ClientCache", () => {
  let mockFactory: ReturnType<typeof vi.fn<(entity: TestEntity) => Promise<string>>>
  let cache: ClientCache<TestEntity, string>

  beforeEach(() => {
    mockFactory = vi.fn()
    cache = new ClientCache(mockFactory)
  })

  describe("get", () => {
    it("should call factory and cache the result for a new entity", async () => {
      const entity: TestEntity = { 
        id: "test-id", 
        updatedAt: new Date("2025-01-01"), 
      }

      const expectedValue = "cached-value"
      mockFactory.mockResolvedValue(expectedValue)

      const result = await cache.get(entity)

      expect(result).toBe(expectedValue)
      expect(mockFactory).toHaveBeenCalledTimes(1)
      expect(mockFactory).toHaveBeenCalledWith(entity)
    })

    it("should return cached value without calling factory for the same entity", async () => {
      const entity: TestEntity = { 
        id: "test-id", 
        updatedAt: new Date("2025-01-01"), 
      }
      const expectedValue = "cached-value"
      mockFactory.mockResolvedValue(expectedValue)

      await cache.get(entity)
      const result = await cache.get(entity)

      expect(result).toBe(expectedValue)
      expect(mockFactory).toHaveBeenCalledTimes(1)
    })

    it("should call factory again when entity is updated", async () => {
      const originalEntity: TestEntity = { 
        id: "test-id", 
        updatedAt: new Date("2024-04-04"), 
      }
      const updatedEntity: TestEntity = { 
        id: "test-id", 
        updatedAt: new Date("2025-05-05"),
      }

      mockFactory
        .mockResolvedValueOnce("original-value")
        .mockResolvedValueOnce("updated-value")

      const originalResult = await cache.get(originalEntity)
      const updatedResult = await cache.get(updatedEntity)

      expect(originalResult).toBe("original-value")
      expect(updatedResult).toBe("updated-value")
      expect(mockFactory).toHaveBeenCalledTimes(2)
      expect(mockFactory).toHaveBeenNthCalledWith(1, originalEntity)
      expect(mockFactory).toHaveBeenNthCalledWith(2, updatedEntity)
    })

    it("should handle multiple different entities independently", async () => {
      const entity1: TestEntity = { 
        id: "id-1", 
        updatedAt: new Date("2025-01-01"), 
      }
      const entity2: TestEntity = { 
        id: "id-2", 
        updatedAt: new Date("2025-01-01"), 
      }

      mockFactory
        .mockResolvedValueOnce("value-1")
        .mockResolvedValueOnce("value-2")

      const result1 = await cache.get(entity1)
      const result2 = await cache.get(entity2)
      const cachedResult1 = await cache.get(entity1)
      const cachedResult2 = await cache.get(entity2)

      expect(result1).toBe("value-1")
      expect(result2).toBe("value-2")
      expect(cachedResult1).toBe("value-1")
      expect(cachedResult2).toBe("value-2")
      expect(mockFactory).toHaveBeenCalledTimes(2)
    })
  })
})

