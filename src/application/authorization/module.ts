import { AwilixContainer } from "awilix"
import registerMetadataModule from "./metadata/module"
import registerTokenModule from "./token/module"

export default function registerAuthorizationModule(container: AwilixContainer) {
  registerMetadataModule(container)
  registerTokenModule(container)
}
