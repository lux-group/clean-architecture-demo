import { AwilixContainer, createContainer, InjectionMode } from "awilix"
import { Application } from "express"
import createServer from "~/app/server"
import registerApp from "~/app/module"
import registerDomainServices from "~/domain/services/module"
import registerInfrastructureServices from "~/infrastructure/module"
import registerPrismaRepositories from "~/infrastructure/repositories/prisma/module"
import registerRedisDecoratorRepositories from "~/infrastructure/repositories/redis/module"
import registerConfig from "~/infrastructure/config/module"
import { TestDataContext } from "./TestDataContext"

export interface TestContext {
  container: AwilixContainer
  server: Application
  data: TestDataContext
}

const createTestContainer = () => {
  const container = createContainer({
    injectionMode: InjectionMode.CLASSIC,
    strict: true,
  })

  registerConfig(container, "test")
  registerApp(container)
  registerDomainServices(container)
  registerInfrastructureServices(container)
  registerPrismaRepositories(container)
  registerRedisDecoratorRepositories(container)
  return container
}

export const getTestContext = (): TestContext => {
  const container = createTestContainer()
  const server = createServer(container)
  const data = new TestDataContext(container)
  return { container, server, data }
}
