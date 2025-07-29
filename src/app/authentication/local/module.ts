import { asClass, AwilixContainer } from "awilix"
import { LocalAuthenticationController } from "./api/LocalAuthenticationController"
import { SignInWithPasswordUseCase } from "./use-cases/SignInWithPasswordUseCase"
import { SignOutUseCase } from "./use-cases/SignOutUseCase"

export default function registerLocalAuthenticationModule(container: AwilixContainer) {
  container.register({
    localAuthenticationController: asClass(LocalAuthenticationController).singleton(),

    signInWithPasswordUseCase: asClass(SignInWithPasswordUseCase).singleton(),
    signOutUseCase: asClass(SignOutUseCase).singleton(),
  })
}
