import { asClass, asFunction, AwilixContainer } from "awilix"
import { handleClientErrors } from "./middleware/handleClientErrors"
import { handleServerErrors } from "./middleware/handleServerErrors"
import { SecureCookieManager } from "./utils/SecureCookieManager"

export default function registerSharedModule(container: AwilixContainer) {
  container.register({
    handleClientErrors: asFunction(handleClientErrors).singleton(),
    handleServerErrors: asFunction(handleServerErrors).singleton(),
    secureCookieManager: asClass(SecureCookieManager).singleton(),
  })
}
