import { AwilixContainer } from "awilix"
import registerIdentityProviderModule from "./identity-provider/module"
import registerSessionModule from "./session/module"
import registerSigningKeyModule from "./signing-key/module"
import registerUserModule from "./user/module"

export default function registerAdminModule(container: AwilixContainer) {
  registerIdentityProviderModule(container)
  registerSessionModule(container)
  registerSigningKeyModule(container)
  registerUserModule(container)
}
