import { asClass, AwilixContainer } from "awilix"

import {
  CreateSignInRequestUseCase,
  CreateSignOutRequestUseCase,
  FrontChannelSignOutUseCase,
  ProcessSignInResponseUseCase,
} from "."

export default function registerExternalModule(container: AwilixContainer) {
  container.register({
    createSignInRequestUseCase: asClass(CreateSignInRequestUseCase).singleton(),
    createSignOutRequestUseCase: asClass(CreateSignOutRequestUseCase).singleton(),
    frontChannelSignOutUseCase: asClass(FrontChannelSignOutUseCase).singleton(),
    processSignInResponseUseCase: asClass(ProcessSignInResponseUseCase).singleton(),
  })
}
