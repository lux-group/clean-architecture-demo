import { asValue, AwilixContainer } from "awilix"
import { Config, schema } from "./schema"
import { config as testConfig } from "./test"
import { config as devConfig } from "./dev"

function readConfig(environment: string): Config {
  switch (environment) {
    case "test":
      return testConfig
    case "dev":
      return devConfig
    default:
      throw new Error(`Unknown environment: ${environment}`)
  }
}

export default async function registerConfig(container: AwilixContainer, environment: string) {
  const configData = readConfig(environment)
  const configResult = schema.safeParse(configData)
  if (!configResult.success) {
    console.error(configResult.error)
    process.exit(1)
  }

  const config = configResult.data

  container.register({
    config: asValue(config),
    baseUrl: asValue(config.apiHost),
    encryptionKeys: asValue(config.encryptionKeys),
    redisUrl: asValue(config.redisUrl),
    sessionConfig: asValue(config.sessions),
    tokenIssuerConfig: asValue(config.tokenIssuer),
  })
}
