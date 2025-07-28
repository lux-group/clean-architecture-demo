import { AwilixContainer, createContainer, InjectionMode } from "awilix"
import { Application } from "express"
import createServer from "~/api/server"
import registerControllers from "~/api/module"
import registerApplicationUseCases from "~/application/module"
import registerDomainServices from "~/domain/services/module"
import registerInfrastructureServices from "~/infrastructure/module"
import registerPrismaRepositories from "~/infrastructure/repositories/prisma/module"
import registerConfig from "~/infrastructure/config/module"
import { TestDataContext } from "./TestDataContext"
import { TestMockContext } from "./TestMockContext"

export interface TestContext {
  server: Application
  container: AwilixContainer
  data: TestDataContext
  mock: TestMockContext
}

const createTestContainer = async () => {
  const container = createContainer({
    injectionMode: InjectionMode.CLASSIC,
    strict: true,
  })

  registerConfig(container, "test")
  registerControllers(container)
  registerApplicationUseCases(container)
  registerDomainServices(container)
  registerInfrastructureServices(container)
  registerPrismaRepositories(container)
  return container
}

export const getTestContext = async (): Promise<TestContext> => {
  const container = await createTestContainer()
  const server = createServer(container)
  const data = new TestDataContext(container)
  const mock = new TestMockContext(container)
  return { server, container, data, mock }
}
