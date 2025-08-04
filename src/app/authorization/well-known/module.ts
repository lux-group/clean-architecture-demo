import { asClass, AwilixContainer } from "awilix"
import { WellKnownController } from "./api/WellKnownController"
import { GetJsonWebKeysHandler } from "./queries/GetJsonWebKeysHandler"
import { GetOpenidConfigurationHandler } from "./queries/GetOpenidConfigurationHandler"

export default function registerWellKnownModule(container: AwilixContainer) {
  container.register({
    wellKnownController: asClass(WellKnownController).singleton(),

    getJsonWebKeysHandler: asClass(GetJsonWebKeysHandler).singleton(),
    getOpenidConfigurationHandler: asClass(GetOpenidConfigurationHandler).singleton(),
  })
}
