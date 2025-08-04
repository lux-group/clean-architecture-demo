import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql"
import { RedisContainer, StartedRedisContainer } from "@testcontainers/redis"
import { execSync } from "child_process"

let postgres: StartedPostgreSqlContainer
let redis: StartedRedisContainer

export async function setup() {
  postgres = await new PostgreSqlContainer("postgres:17.4").start()
  redis = await new RedisContainer("valkey/valkey:8.1").start()

  process.env.DATABASE_READONLY_URL = postgres.getConnectionUri()
  process.env.DATABASE_URL = postgres.getConnectionUri()
  process.env.REDIS_URL = redis.getConnectionUrl()

  execSync("npx prisma migrate deploy", { env: process.env, stdio: "inherit" })
}

export async function teardown() {
  await Promise.all([postgres?.stop(), redis?.stop()])
}
