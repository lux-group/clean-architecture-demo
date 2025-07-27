import { StartedPostgreSqlContainer } from "@testcontainers/postgresql"

const globals = globalThis as {
  __POSTGRES__?: StartedPostgreSqlContainer
}

export default async () => {
  const postgres = globals.__POSTGRES__
  await Promise.all([postgres?.stop()])
}
