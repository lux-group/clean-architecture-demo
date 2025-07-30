import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql"
import { RedisContainer, StartedRedisContainer } from "@testcontainers/redis"
import { execSync } from "child_process"

const globals = globalThis as {
  __POSTGRES__?: StartedPostgreSqlContainer
  __REDIS__?: StartedRedisContainer;
}

export default async () => {
  const postgres = await new PostgreSqlContainer("postgres:17.4").start()
  const redis = await new RedisContainer("valkey/valkey:8.1").start()

  process.env.DATABASE_READONLY_URL = postgres.getConnectionUri()
  process.env.DATABASE_URL = postgres.getConnectionUri()
  process.env.REDIS_URL = redis.getConnectionUrl();

  execSync("npx prisma migrate deploy", { env: process.env, stdio: "inherit" })

  globals.__POSTGRES__ = postgres
  globals.__REDIS__ = redis
}
