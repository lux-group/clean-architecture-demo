import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql"
import { execSync } from "child_process"

const globals = globalThis as {
  __POSTGRES__?: StartedPostgreSqlContainer
}

export default async () => {
  const postgres = await new PostgreSqlContainer("postgres:17.4").start()
  globals.__POSTGRES__ = postgres

  const env = { ...process.env, DATABASE_URL: postgres.getConnectionUri() }
  execSync("npx prisma migrate deploy", { env, stdio: "inherit" })

  // We cannot use the DATABASE_URL environment variable here because it is
  // used by components tests and the two Postgres instances will interfere
  // if the tests run at the same time.
  process.env.PRISMA_TEST_DATABASE_URL = postgres.getConnectionUri()
}
