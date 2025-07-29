import { asClass, AwilixContainer } from "awilix"
import { SigningKeyController } from "./api/SigningKeyController"
import { CreateNewSigningKeyUseCase } from "./use-cases/CreateNewSigningKeyUseCase"
import { DeleteSigningKeyUseCase } from "./use-cases/DeleteSigningKeyUseCase"
import { GetAllSigningKeysUseCase } from "./use-cases/GetAllSigningKeysUseCase"
import { GetSigningKeyByIdUseCase } from "./use-cases/GetSigningKeyByIdUseCase"

export default function registerSigningKeyAdminModule(container: AwilixContainer) {
  container.register({
    signingKeyController: asClass(SigningKeyController).singleton(),

    createNewSigningKeyUseCase: asClass(CreateNewSigningKeyUseCase).singleton(),
    deleteSigningKeyUseCase: asClass(DeleteSigningKeyUseCase).singleton(),
    getAllSigningKeysUseCase: asClass(GetAllSigningKeysUseCase).singleton(),
    getSigningKeyByIdUseCase: asClass(GetSigningKeyByIdUseCase).singleton(),
  })
}
