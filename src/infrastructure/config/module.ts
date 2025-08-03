import { asValue, AwilixContainer } from "awilix"
import { schema } from "./schema"
import { config as testConfig } from "./test"
import { config as devConfig } from "./dev"

export default function registerConfig(container: AwilixContainer, environment: string) {
  let configData
  switch (environment) {
    case "test":
      configData = testConfig
      break
    case "dev":
      configData = devConfig
      break
    default:
      throw new Error(`Unknown environment: ${environment}`)
  }
  
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
