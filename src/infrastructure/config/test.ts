import { Config } from './schema';

export const config: Config = {
  api: {
    host: 'http://localhost:3000',
  },
  postgres: {
    readOnlyUrl: process.env.DATABASE_READONLY_URL,
    readWriteUrl: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  sessions: {
    localSessionLifetimeHours: 8760, // 1 year
    minSessionRefreshDelayMinutes: 10,
  },
  tokenIssuer: {
    audience: 'test-le',
    lifetimeSeconds: 3600, // 1 hour
  },
  encryptionKeys: ['b7e1c8a4f2d3e6b9a1c4d5e7f8b2a3c6d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9'],
};
