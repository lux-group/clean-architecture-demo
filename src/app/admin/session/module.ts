import { asClass, AwilixContainer } from "awilix"
import { SessionController } from "./api/SessionController"
import { GetAllSessionsUseCase } from "./use-cases/GetAllSessionsUseCase"
import { GetSessionByIdUseCase } from "./use-cases/GetSessionByIdUseCase"
import { TerminateSessionUseCase } from "./use-cases/TerminateSessionUseCase"

export default function registerSessionAdminModule(container: AwilixContainer) {
  container.register({
    sessionController: asClass(SessionController).singleton(),

    getAllSessionsUseCase: asClass(GetAllSessionsUseCase).singleton(),
    getSessionByIdUseCase: asClass(GetSessionByIdUseCase).singleton(),
    terminateSessionUseCase: asClass(TerminateSessionUseCase).singleton(),
  })
}
