import { z } from 'zod';

export const schema = z.object({
  api: z.object({
    host: z.string().nonempty(),
    basePath: z.string().nonempty().default('/auth/v2'),
    adminBasePath: z.string().nonempty().default('/auth/v2/admin'),
  }),
  postgres: z.object({
    readOnlyUrl: z.string().nonempty().default(process.env.DATABASE_READONLY_URL!),
    readWriteUrl: z.string().nonempty().default(process.env.DATABASE_URL!),
  }),
  redis: z.object({
    url: z.string().default(process.env.REDIS_URL!),
  }),
  sessions: z.object({
    localSessionLifetimeHours: z.number().min(1).default(8760),
    minSessionRefreshDelayMinutes: z.number().min(1).default(10),
  }),
  tokenIssuer: z.object({
    path: z.string().nonempty().default('/auth/v2'),
    audience: z.string().nonempty(),
    lifetimeSeconds: z.number().min(1).default(3600),
  }),
  encryptionKeys: z.array(z.string().length(64)),
});

export type Config = z.input<typeof schema>;
