import { asClass, AwilixContainer } from "awilix"
import { SecureCookieManager } from "./utils/SecureCookieManager"
import { IdentityProviderController } from "./controllers/admin/IdentityProviderController"
import { SessionController } from "./controllers/admin/SessionController"
import { SigningKeyController } from "./controllers/admin/SigningKeyController"
import { UserController } from "./controllers/admin/UserController"
import { LocalAuthenticationController } from "./controllers/authentication/LocalAuthenticationController"
import { ExternalAuthenticationController } from "./controllers/authentication/ExternalAuthenticationController"
import { MetadataController } from "./controllers/authorization/MetadataController"
import { TokenController } from "./controllers/authorization/TokenController"
import { EntraExtensionController } from "./controllers/integration/EntraExtensionController"

export default function registerControllers(container: AwilixContainer) {
  container.register({
    secureCookieManager: asClass(SecureCookieManager).singleton(),

    identityProviderController: asClass(IdentityProviderController).singleton(),
    sessionController: asClass(SessionController).singleton(),
    signingKeyController: asClass(SigningKeyController).singleton(),
    userController: asClass(UserController).singleton(),
    localAuthenticationController: asClass(LocalAuthenticationController).singleton(),
    externalAuthenticationController: asClass(ExternalAuthenticationController).singleton(),
    metadataController: asClass(MetadataController).singleton(),
    tokenController: asClass(TokenController).singleton(),
    entraExtensionController: asClass(EntraExtensionController).singleton(),
  })
}
