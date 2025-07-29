import { asValue, AwilixContainer } from "awilix"
import { schema } from "./schema"

export default function registerConfig(container: AwilixContainer, environment: string) {
  const configResult = schema.safeParse(require(`./${environment}`).config)
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
