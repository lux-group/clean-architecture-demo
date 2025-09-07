import { AwilixContainer, asClass } from "awilix"
import { IdentityProviderController } from "./api/IdentityProviderController"
import { CreateIdentityProviderHandler } from "./commands/CreateIdentityProviderHandler"
import { DeleteIdentityProviderHandler } from "./commands/DeleteIdentityProviderHandler"
import { UpdateIdentityProviderHandler } from "./commands/UpdateIdentityProviderHandler"
import { GetIdentityProviderByIdHandler } from "./queries/GetIdentityProviderByIdHandler"
import { SearchIdentityProvidersHandler } from "./queries/SearchIdentityProvidersHandler"

export default async function registerIdentityProviderAdminModule(container: AwilixContainer) {
  container.register({
    identityProviderController: asClass(IdentityProviderController).singleton(),

    createIdentityProviderHandler: asClass(CreateIdentityProviderHandler).singleton(),
    deleteIdentityProviderHandler: asClass(DeleteIdentityProviderHandler).singleton(),
    updateIdentityProviderHandler: asClass(UpdateIdentityProviderHandler).singleton(),

    getIdentityProviderByIdHandler: asClass(GetIdentityProviderByIdHandler).singleton(),
    searchIdentityProvidersHandler: asClass(SearchIdentityProvidersHandler).singleton(),
  })
}
