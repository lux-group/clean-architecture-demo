import { AwilixContainer, createContainer, InjectionMode } from "awilix"
import { Application } from "express"
import registerApp from "~/app/module"
import createServer from "~/app/server"
import registerDomainServices from "~/domain/services/module"
import { TokenIssuer, TokenRequest, TokenVersion } from "~/app/ports"
import registerInfrastructureServices from "~/infrastructure/module"
import registerPrismaRepositories from "~/infrastructure/repositories/prisma/module"
import registerRedisDecoratorRepositories from "~/infrastructure/repositories/redis/module"
import registerConfig from "~/infrastructure/config/module"
import { TestDataContext } from "./TestDataContext"

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

  // Ensure we have a signing key.
  await data.getActiveSigningKey()

  const createAccessToken = async (userId: string, scopes: string[]) => {
    const tokenIssuer = container.resolve<TokenIssuer>("tokenIssuer")
    const request: TokenRequest = { version: TokenVersion.V2, userId, scopes, customClaims: {} }
    return (await tokenIssuer.createAccessToken(request)).accessToken
  }

  return { container, server, data, createAccessToken }
}
