# ADR-004: Repository Pattern with Decorator for Caching

## Status
Accepted

## Context
The application needs to abstract data persistence while providing caching capabilities for performance. We need a solution that:
- Separates domain logic from data access concerns
- Allows multiple storage strategies (database, cache, BigQuery, memory, external services)
- Supports layered caching without tight coupling
- Maintains clean interfaces for testing

Patterns considered:
- **Direct ORM Usage**: Simple but creates tight coupling and moves mapping logic into business logic
- **Repository Pattern**: Good abstraction but no built-in caching
- **Repository + Service Layer**: Additional complexity
- **Decorator Pattern**: Layers functionality transparently

## Decision
We will implement the Repository Pattern with Decorator Pattern for caching because:

1. **Clean Abstraction**: Domain doesn't know about persistence details
2. **Flexible Layering**: Cache can be added/removed transparently
3. **Single Responsibility**: Each repository layer has one purpose
4. **Composability**: Different caching strategies can be combined
5. **Testability**: Each layer can be tested independently

## Implementation Architecture

```
Domain Layer
    ↓ (depends on interface)
UserRepository Interface
    ↓ (implemented by)
RedisUserRepository (Decorator)
    ↓ (decorates)
PrismaUserRepository (Base Implementation)
    ↓ (uses)
Database
```

## Implementation Pattern

### Repository Interface (Domain)
```typescript
export interface UserRepository extends Repository<User> {
  tryGetByBrandAndEmail(brand: string, email: string): Promise<User | undefined>
  getByBrand(brand: string): Promise<User[]>
  search(criteria: UserSearchCriteria): Promise<PaginatedResult<User>>
}
```

### Base Implementation (Infrastructure)
```typescript
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getById(id: string): Promise<User> {
    const record = await this.prisma.user.findUnique({ where: { id } })
    if (!record) throw new NotFoundError("User not found")
    return this.mapToDomain(record)
  }

  async insert(user: User): Promise<void> {
    const data = this.mapToPersistence(user)
    await this.prisma.user.create({ data })
  }
}
```

### Cache Decorator (Infrastructure)
```typescript
export class RedisUserRepository implements UserRepository {
  constructor(
    private readonly decoratedRepository: UserRepository,
    private readonly cache: RedisClient,
    private readonly ttl: number = 300, // 5 minutes
  ) {}

  async getById(id: string): Promise<User> {
    // Try cache first
    const cacheKey = `user:${id}`
    const cached = await this.cache.get(cacheKey)
    
    if (cached) {
      return JSON.parse(cached)
    }

    // Fallback to decorated repository
    const user = await this.decoratedRepository.getById(id)
    
    // Cache the result
    await this.cache.setex(cacheKey, this.ttl, JSON.stringify(user))
    
    return user
  }

  async insert(user: User): Promise<void> {
    // Delegate to decorated repository
    await this.decoratedRepository.insert(user)
    
    // Invalidate related cache entries
    await this.invalidateUserCache(user.id)
  }
}
```

### Registration (DI Container)
```typescript
container.register({
  // Base repository
  prismaUserRepository: asClass(PrismaUserRepository).singleton(),
  
  // Decorated repository (what the domain uses)
  userRepository: asFunction(({ prismaUserRepository, redisClient }) => 
    new RedisUserRepository(prismaUserRepository, redisClient)
  ).singleton(),
})
```

## Caching Strategy

### Cache Key Patterns
- **Entity by ID**: `user:{id}`
- **Query Results**: `user:search:{hash(criteria)}`
- **List Results**: `user:brand:{brand}`

### Cache Invalidation
- **Single Entity**: Remove specific keys on updates
- **Query Invalidation**: Remove related query caches
- **Time-based**: TTL for automatic expiration
- **Tag-based**: Group related cache entries

### Cache-Aside Pattern
```typescript
async getByBrand(brand: string): Promise<User[]> {
  const cacheKey = `user:brand:${brand}`
  
  // Try cache
  const cached = await this.cache.get(cacheKey)
  if (cached) return JSON.parse(cached)
  
  // Load from source
  const users = await this.decoratedRepository.getByBrand(brand)
  
  // Cache result
  await this.cache.setex(cacheKey, this.ttl, JSON.stringify(users))
  
  return users
}
```

## Consequences

### Positive
- **Separation of Concerns**: Each layer has single responsibility
- **Flexibility**: Easy to add/remove caching layers
- **Testability**: Mock decorators independently
- **Performance**: Transparent caching without domain changes
- **Maintainability**: Changes to caching don't affect domain logic

### Negative
- **Complexity**: More classes and interfaces to manage
- **Indirection**: Additional layers between domain and data
- **Cache Consistency**: Need careful invalidation strategies

## Implementation Notes
- Use consistent cache key naming conventions
- Implement proper error handling for cache failures
- Consider cache warming strategies for critical data
- Monitor cache hit rates and adjust TTL accordingly
