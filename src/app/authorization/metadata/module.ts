import { asClass, AwilixContainer } from "awilix"
import { MetadataController } from "./api/MetadataController"
import { GetJsonWebKeysHandler } from "./queries/GetJsonWebKeysHandler"
import { GetOpenidConfigurationHandler } from "./queries/GetOpenidConfigurationHandler"

export default function registerMetadataModule(container: AwilixContainer) {
  container.register({
    metadataController: asClass(MetadataController).singleton(),

    getJsonWebKeysHandler: asClass(GetJsonWebKeysHandler).singleton(),
    getOpenidConfigurationHandler: asClass(GetOpenidConfigurationHandler).singleton(),
  })
}
