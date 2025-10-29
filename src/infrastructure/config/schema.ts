import { z } from "zod"

export const schema = z.object({
  apiHost: z.string().nonempty(),
  postgresReadOnlyUrl: z.string().default(process.env.DATABASE_READONLY_URL!),
  postgresReadWriteUrl: z.string().default(process.env.DATABASE_URL!),
  redisUrl: z.string().default(process.env.REDIS_URL!),
  encryptionKeys: z.array(z.string().length(64)),
  sessions: z.object({
    localSessionLifetimeHours: z.number().min(1).default(8760),
    minSessionRefreshDelayMinutes: z.number().min(1).default(10),
  }),
  tokenIssuer: z.object({
    path: z.string().nonempty().default("/auth/v2"),
    audience: z.string().nonempty(),
    lifetimeSeconds: z.number().min(1).default(3600),
  }),
})

export type Config = z.input<typeof schema>
