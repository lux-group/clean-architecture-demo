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

  const env = { ...process.env, DATABASE_URL: postgres.getConnectionUri() }
  execSync("npx prisma migrate deploy", { env, stdio: "inherit" })

  // We cannot use the standard environment variable here because they
  // are used by components tests and the two instances will interfere
  // if the tests run at the same time.
  process.env.PRISMA_TEST_DATABASE_URL = postgres.getConnectionUri()
  process.env.REDIS_TEST_DATABASE_URL = redis.getConnectionUrl()

  globals.__POSTGRES__ = postgres
  globals.__REDIS__ = redis
}
