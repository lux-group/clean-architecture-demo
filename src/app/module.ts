import { AwilixContainer } from "awilix"
import registerIdentityProviderAdminModule from "./admin/identity-provider/module"
import registerSessionAdminModule from "./admin/session/module"
import registerSigningKeyAdminModule from "./admin/signing-key/module"
import registerUserAdminModule from "./admin/user/module"
import registerExternalAuthenticationModule from "./authentication/external/module"
import registerLocalAuthenticationModule from "./authentication/local/module"
import registerTokenModule from "./authorization/token/module"
import registerWellKnownModule from "./authorization/well-known/module"
import registerEntraIntegrationModule from "./integration/entra/module"
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
