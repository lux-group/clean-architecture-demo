import { asClass, AwilixContainer } from "awilix"
import { IdentityProviderController } from "./api/IdentityProviderController"
import { CreateIdentityProviderUseCase } from "./use-cases/CreateIdentityProviderUseCase"
import { DeleteIdentityProviderUseCase } from "./use-cases/DeleteIdentityProviderUseCase"
import { GetAllIdentityProvidersUseCase } from "./use-cases/GetAllIdentityProvidersUseCase"
import { GetIdentityProviderByIdUseCase } from "./use-cases/GetIdentityProviderByIdUseCase"
import { UpdateIdentityProviderUseCase } from "./use-cases/UpdateIdentityProviderUseCase"

export default function registerIdentityProviderAdminModule(container: AwilixContainer) {
  container.register({
    identityProviderController: asClass(IdentityProviderController).singleton(),

    createIdentityProviderUseCase: asClass(CreateIdentityProviderUseCase).singleton(),
    deleteIdentityProviderUseCase: asClass(DeleteIdentityProviderUseCase).singleton(),
    getAllIdentityProvidersUseCase: asClass(GetAllIdentityProvidersUseCase).singleton(),
    getIdentityProviderByIdUseCase: asClass(GetIdentityProviderByIdUseCase).singleton(),
    updateIdentityProviderUseCase: asClass(UpdateIdentityProviderUseCase).singleton(),
  })
}
