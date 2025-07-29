import { asClass, AwilixContainer } from "awilix"
import { SecureCookieManager } from "./shared/utils/SecureCookieManager"

import registerIdentityProviderAdminModule from "./admin/identity-provider/module"
import registerSessionAdminModule from "./admin/session/module"
import registerSigningKeyAdminModule from "./admin/signing-key/module"
import registerUserAdminModule from "./admin/user/module"

import registerExternalAuthenticationModule from "./authentication/external/module"
import registerLocalAuthenticationModule from "./authentication/local/module"

import registerMetadataModule from "./authorization/metadata/module"
import registerTokenModule from "./authorization/token/module"

import registerEntraIntegrationModule from "./integration/entra/module"

export default function registerApp(container: AwilixContainer) {
  container.register({
    secureCookieManager: asClass(SecureCookieManager).singleton(),
  })

  registerIdentityProviderAdminModule(container)
  registerSessionAdminModule(container)
  registerSigningKeyAdminModule(container)
  registerUserAdminModule(container)

  registerExternalAuthenticationModule(container)
  registerLocalAuthenticationModule(container)

  registerMetadataModule(container)
  registerTokenModule(container)

  registerEntraIntegrationModule(container)
}
