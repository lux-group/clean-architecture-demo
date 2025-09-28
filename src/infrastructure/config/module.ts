import { AwilixContainer, asValue } from "awilix"
import { schema } from "./schema"

export default async function registerConfig(container: AwilixContainer, environment: string) {
  const importedConfig = await import(`./${environment}`)
  const configResult = schema.safeParse(importedConfig.config);
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
