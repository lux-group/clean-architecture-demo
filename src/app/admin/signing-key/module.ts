import { asClass, AwilixContainer } from "awilix"
import { SigningKeyController } from "./api/SigningKeyController"
import { CreateNewSigningKeyHandler } from "./commands/CreateNewSigningKeyHandler"
import { DeleteSigningKeyHandler } from "./commands/DeleteSigningKeyHandler"
import { GetSigningKeyByIdHandler } from "./queries/GetSigningKeyByIdHandler"
import { SearchSigningKeysHandler } from "./queries/SearchSigningKeysHandler"

export default async function registerSigningKeyAdminModule(container: AwilixContainer) {
  container.register({
    signingKeyController: asClass(SigningKeyController).singleton(),

    createNewSigningKeyHandler: asClass(CreateNewSigningKeyHandler).singleton(),
    deleteSigningKeyHandler: asClass(DeleteSigningKeyHandler).singleton(),

    getSigningKeyByIdHandler: asClass(GetSigningKeyByIdHandler).singleton(),
    searchSigningKeysHandler: asClass(SearchSigningKeysHandler).singleton(),
  })
}
