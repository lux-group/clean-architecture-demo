import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql"
import { RedisContainer, StartedRedisContainer } from "@testcontainers/redis"
import { execSync } from "child_process"

const globals = globalThis as {
  __POSTGRES__?: StartedPostgreSqlContainer
  __REDIS__?: StartedRedisContainer;
}

export async function setup() {
  const postgres = await new PostgreSqlContainer("postgres:17.4").start()
  const redis = await new RedisContainer("valkey/valkey:8.1").start()

  process.env.DATABASE_READONLY_URL = postgres.getConnectionUri()
  process.env.DATABASE_URL = postgres.getConnectionUri()
  process.env.REDIS_URL = redis.getConnectionUrl();

  execSync("npx prisma migrate deploy", { env: process.env, stdio: "inherit" })

  globals.__POSTGRES__ = postgres
  globals.__REDIS__ = redis
}

export async function teardown() {
  const postgres = globals.__POSTGRES__;
  const redis = globals.__REDIS__;
  await Promise.all([postgres?.stop(), redis?.stop()]);
}
