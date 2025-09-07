import { AwilixContainer } from "awilix"
import registerIdentityProviderAdminModule from "./modules/admin/identity-provider/module"
import registerSessionAdminModule from "./modules/admin/session/module"
import registerSigningKeyAdminModule from "./modules/admin/signing-key/module"
import registerUserAdminModule from "./modules/admin/user/module"
import registerExternalAuthenticationModule from "./modules/authentication/external/module"
import registerLocalAuthenticationModule from "./modules/authentication/local/module"
import registerTokenModule from "./modules/authorization/token/module"
import registerWellKnownModule from "./modules/authorization/well-known/module"
import registerEntraIntegrationModule from "./modules/integration/entra/module"
import registerSharedModule from "./shared/module"

export default async function registerApp(container: AwilixContainer) {
  await registerIdentityProviderAdminModule(container)
  await registerSessionAdminModule(container)
  await registerSigningKeyAdminModule(container)
  await registerUserAdminModule(container)
  await registerExternalAuthenticationModule(container)
  await registerLocalAuthenticationModule(container)
  await registerWellKnownModule(container)
  await registerTokenModule(container)
  await registerEntraIntegrationModule(container)
  await registerSharedModule(container)
}
