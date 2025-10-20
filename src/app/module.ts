import { AwilixContainer, asClass, asFunction } from "awilix"
import registerIdentityProviderAdminModule from "./modules/admin/identity-provider/module"
import registerSessionAdminModule from "./modules/admin/session/module"
import registerSigningKeyAdminModule from "./modules/admin/signing-key/module"
import registerUserAdminModule from "./modules/admin/user/module"
import registerEntraIntegrationModule from "./modules/integration/entra/module"
import registerExternalAuthenticationModule from "./modules/public/auth-external/module"
import registerLocalAuthenticationModule from "./modules/public/auth-local/module"
import registerPublicModule from "./modules/public/profile/module"
import registerTokenModule from "./modules/public/token/module"
import registerWellKnownModule from "./modules/public/well-known/module"
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

  // Register application modules
  await registerIdentityProviderAdminModule(container)
  await registerSessionAdminModule(container)
  await registerSigningKeyAdminModule(container)
  await registerUserAdminModule(container)

  await registerEntraIntegrationModule(container)

  await registerExternalAuthenticationModule(container)
  await registerLocalAuthenticationModule(container)
  await registerPublicModule(container)
  await registerTokenModule(container)
  await registerWellKnownModule(container)
}
