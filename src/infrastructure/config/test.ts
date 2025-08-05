import { Config } from "./schema"

export const config: Config = {
  apiHost: "http://localhost:3000",
  postgresReadOnlyUrl: process.env.DATABASE_READONLY_URL,
  postgresReadWriteUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  encryptionKeys: [
    "b7e1c8a4f2d3e6b9a1c4d5e7f8b2a3c6d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9"
  ],
  sessions: {
    localSessionLifetimeHours: 8760, // 1 year
    externalSessionLifetimeHours: 12,
    minSessionRefreshDelayMinutes: 10
  },
  tokenIssuer: {
    audience: "test-le",
    lifetimeSeconds: 3600, // 1 hour
  }
}
