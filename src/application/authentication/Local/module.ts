import { asClass, AwilixContainer } from "awilix"

import {
  SignInWithPasswordUseCase,
  SignOutUseCase,
} from "."

export default function registerLocalModule(container: AwilixContainer) {
  container.register({
    signInWithPasswordUseCase: asClass(SignInWithPasswordUseCase).singleton(),
    signOutUseCase: asClass(SignOutUseCase).singleton(),
  })
}
