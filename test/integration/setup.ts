import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql"
import { execSync } from "child_process"

const globals = globalThis as {
  __POSTGRES__?: StartedPostgreSqlContainer
}

export default async () => {
  const postgres = await new PostgreSqlContainer("postgres:17.4").start()
  globals.__POSTGRES__ = postgres

  process.env.DATABASE_READONLY_URL = postgres.getConnectionUri()
  process.env.DATABASE_URL = postgres.getConnectionUri()

  execSync("npx prisma migrate deploy", { env: process.env, stdio: "inherit" })
}
