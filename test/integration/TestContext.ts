import { AwilixContainer, createContainer, InjectionMode } from "awilix"
import { Application } from "express"
import createServer from "~/app/server"
import registerApp from "~/app/module"
import registerInfrastructureServices from "~/infrastructure/module"
import registerPrismaRepositories from "~/infrastructure/repositories/prisma/module"
import registerRedisDecoratorRepositories from "~/infrastructure/repositories/redis/module"
import registerConfig from "~/infrastructure/config/module"
import { TestDataContext } from "./TestDataContext"
import { TokenIssuer, TokenRequest } from "~/domain/adapters/TokenIssuer"
import registerDomainServices from "~/domain/services/module"

export interface TestContext {
  container: AwilixContainer
  server: Application
  data: TestDataContext
  createAccessToken: (userId: string, scopes: string[]) => Promise<string>
}

const createTestContainer = async () => {
  const container = createContainer({
    injectionMode: InjectionMode.CLASSIC,
    strict: true,
  })

  await registerConfig(container, "test")
  await registerApp(container)
  await registerDomainServices(container)
  await registerInfrastructureServices(container)
  await registerPrismaRepositories(container)
  await registerRedisDecoratorRepositories(container)
  return container
}

export const getTestContext = async (): Promise<TestContext> => {
  const container = await createTestContainer()
  const server = createServer(container)
  const data = new TestDataContext(container)

  const createAccessToken = async (userId: string, scopes: string[]) => {
    const tokenIssuer = container.resolve<TokenIssuer>("tokenIssuer")
    const signingKey = await data.getActiveSigningKey()
    const request: TokenRequest = { userId, scopes, customClaims: {} }
    return tokenIssuer.createAccessToken(signingKey, request).accessToken
  }

  return { container, server, data, createAccessToken }
}
