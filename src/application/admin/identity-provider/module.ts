import { asClass, AwilixContainer } from "awilix"

import {
  CreateIdentityProviderUseCase,
  DeleteIdentityProviderUseCase,
  GetAllIdentityProvidersUseCase,
  GetIdentityProviderByIdUseCase,
  UpdateIdentityProviderUseCase
} from "."

export default function registerIdentityProviderModule(container: AwilixContainer) {
  container.register({
    createIdentityProviderUseCase: asClass(CreateIdentityProviderUseCase).singleton(),
    deleteIdentityProviderUseCase: asClass(DeleteIdentityProviderUseCase).singleton(),
    getAllIdentityProvidersUseCase: asClass(GetAllIdentityProvidersUseCase).singleton(),
    getIdentityProviderByIdUseCase: asClass(GetIdentityProviderByIdUseCase).singleton(),
    updateIdentityProviderUseCase: asClass(UpdateIdentityProviderUseCase).singleton(),
  })
}
