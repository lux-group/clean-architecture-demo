import { asClass, AwilixContainer } from "awilix"
import { ExternalAuthenticationController } from "./api/ExternalAuthenticationController"
import { CreateSignInRequestUseCase } from "./use-cases/CreateSignInRequestUseCase"
import { CreateSignOutRequestUseCase } from "./use-cases/CreateSignOutRequestUseCase"
import { FrontChannelSignOutUseCase } from "./use-cases/FrontChannelSignOutUseCase"
import { ProcessSignInResponseUseCase } from "./use-cases/ProcessSignInResponseUseCase"

export default function registerExternalAuthenticationModule(container: AwilixContainer) {
  container.register({
    externalAuthenticationController: asClass(ExternalAuthenticationController).singleton(),

    createSignInRequestUseCase: asClass(CreateSignInRequestUseCase).singleton(),
    createSignOutRequestUseCase: asClass(CreateSignOutRequestUseCase).singleton(),
    frontChannelSignOutUseCase: asClass(FrontChannelSignOutUseCase).singleton(),
    processSignInResponseUseCase: asClass(ProcessSignInResponseUseCase).singleton(),
  })
}
