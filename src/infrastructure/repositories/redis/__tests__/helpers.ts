import { RedisContainer, StartedRedisContainer } from "@testcontainers/redis"
import { createClient, RedisClientType } from "redis"
import { EncryptionProvider } from "~/infrastructure/crypto"

class MockEncryptionProvider implements EncryptionProvider {
  encrypt = (data: string) => `encrypted_${data}`
  decrypt = (data: string) => data.replace("encrypted_", "")
}

export interface RedisTestContext {
  redis: StartedRedisContainer
  redisClient: RedisClientType
  encryptionProvider: EncryptionProvider
  destroy: () => Promise<void>
}

export async function createRedisTestContext(): Promise<RedisTestContext> {
  const redis = await new RedisContainer("valkey/valkey:8.1").start()
  const redisClient = createClient({ url: redis.getConnectionUrl() }) as RedisClientType
  
  await redisClient.connect()

  const encryptionProvider = new MockEncryptionProvider()

  return { 
    redis, 
    redisClient, 
    encryptionProvider, 
    destroy: async () => {
      await redisClient.quit()
      await redis.stop()
    }
  }
} 