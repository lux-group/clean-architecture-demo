import { asClass, AwilixContainer } from "awilix"
import {
  GetAllSessionsUseCase,
  GetSessionByIdUseCase,
  TerminateSessionUseCase
} from "."

export default function registerSessionModule(container: AwilixContainer) {
  container.register({
    getAllSessionsUseCase: asClass(GetAllSessionsUseCase).singleton(),
    getSessionByIdUseCase: asClass(GetSessionByIdUseCase).singleton(),
    terminateSessionUseCase: asClass(TerminateSessionUseCase).singleton(),
  })
}
