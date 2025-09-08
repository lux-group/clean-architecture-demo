import { asClass, asFunction, AwilixContainer } from "awilix"
import registerIdentityProviderAdminModule from "./modules/admin/identity-provider/module"
import registerSessionAdminModule from "./modules/admin/session/module"
import registerSigningKeyAdminModule from "./modules/admin/signing-key/module"
import registerUserAdminModule from "./modules/admin/user/module"
import registerExternalAuthenticationModule from "./modules/authentication/external/module"
import registerLocalAuthenticationModule from "./modules/authentication/local/module"
import registerTokenModule from "./modules/authorization/token/module"
import registerWellKnownModule from "./modules/authorization/well-known/module"
import registerEntraIntegrationModule from "./modules/integration/entra/module"
import { authorize } from "./shared/middleware/authorize"
import { handleDomainErrors } from "./shared/middleware/handleDomainErrors"
import { handleServerErrors } from "./shared/middleware/handleServerErrors"
import { SecureCookieManager } from "./shared/utils/SecureCookieManager"

export default async function registerApp(container: AwilixContainer) {
  // Register middleware and utilities
  container.register({
    authorize: asFunction(authorize).singleton(),
    handleDomainErrors: asFunction(handleDomainErrors).singleton(),
    handleServerErrors: asFunction(handleServerErrors).singleton(),
    secureCookieManager: asClass(SecureCookieManager).singleton(),
  })

  // Register application modules (use cases)
  await registerIdentityProviderAdminModule(container)
  await registerSessionAdminModule(container)
  await registerSigningKeyAdminModule(container)
  await registerUserAdminModule(container)
  await registerExternalAuthenticationModule(container)
  await registerLocalAuthenticationModule(container)
  await registerWellKnownModule(container)
  await registerTokenModule(container)
  await registerEntraIntegrationModule(container)
}
