import { StartedPostgreSqlContainer } from "@testcontainers/postgresql"
import { StartedRedisContainer } from "@testcontainers/redis"

const globals = globalThis as {
  __POSTGRES__?: StartedPostgreSqlContainer
  __REDIS__?: StartedRedisContainer;
}

export default async () => {
  const postgres = globals.__POSTGRES__;
  const redis = globals.__REDIS__;
  await Promise.all([postgres?.stop(), redis?.stop()]);
}
