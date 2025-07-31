import { asClass, AwilixContainer } from "awilix"
import { LocalAuthenticationController } from "./api/LocalAuthenticationController"
import { SignInWithPasswordHandler } from "./commands/SignInWithPasswordHandler"
import { SignOutHandler } from "./commands/SignOutHandler"

export default function registerLocalAuthenticationModule(container: AwilixContainer) {
  container.register({
    localAuthenticationController: asClass(LocalAuthenticationController).singleton(),

    signInWithPasswordHandler: asClass(SignInWithPasswordHandler).singleton(),
    signOutHandler: asClass(SignOutHandler).singleton(),
  })
}
