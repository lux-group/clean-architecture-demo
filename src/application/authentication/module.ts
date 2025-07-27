import { AwilixContainer } from "awilix"
import registerExternalModule from "./external/module"
import registerLocalModule from "./local/module"

export default function registerAuthenticationModule(container: AwilixContainer) {
  registerExternalModule(container)
  registerLocalModule(container)
}
