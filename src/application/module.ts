import { AwilixContainer } from "awilix"
import registerAdminModule from "./admin/module"
import registerAuthenticationModule from "./authentication/module"
import registerAuthorizationModule from "./authorization/module"

export default function registerApplicationUseCases(container: AwilixContainer) {
  registerAdminModule(container)
  registerAuthenticationModule(container)
  registerAuthorizationModule(container)
}
