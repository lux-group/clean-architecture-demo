import { asClass, asFunction, AwilixContainer } from "awilix"
import { handleClientErrors } from "./middleware/handleClientErrors"
import { handleOAuthErrors } from "./middleware/handleOAuthErrors"
import { handleServerErrors } from "./middleware/handleServerErrors"
import { SecureCookieManager } from "./utils/SecureCookieManager"
import { authorize } from "./middleware/authorize"

export default function registerSharedModule(container: AwilixContainer) {
  container.register({
    authorize: asFunction(() => authorize).singleton(),
    handleClientErrors: asFunction(handleClientErrors).singleton(),
    handleOAuthErrors: asFunction(handleOAuthErrors).singleton(),
    handleServerErrors: asFunction(handleServerErrors).singleton(),
    secureCookieManager: asClass(SecureCookieManager).singleton(),
  })
}
