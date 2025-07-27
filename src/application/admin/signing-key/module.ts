import { asClass, AwilixContainer } from "awilix"
import {
  CreateNewSigningKeyUseCase,
  DeleteSigningKeyUseCase,
  GetAllSigningKeysUseCase,
  GetSigningKeyByIdUseCase,
} from "."

export default function registerSigningKeyModule(container: AwilixContainer) {
  container.register({
    createNewSigningKeyUseCase: asClass(CreateNewSigningKeyUseCase).singleton(),
    deleteSigningKeyUseCase: asClass(DeleteSigningKeyUseCase).singleton(),
    getAllSigningKeysUseCase: asClass(GetAllSigningKeysUseCase).singleton(),
    getSigningKeyByIdUseCase: asClass(GetSigningKeyByIdUseCase).singleton(),
  })
}
