import { AwilixContainer, asClass } from 'awilix';
import { CreateNewSigningKeyHandler } from './CreateNewSigningKeyHandler';
import { DeleteSigningKeyHandler } from './DeleteSigningKeyHandler';
import { GetSigningKeyByIdHandler } from './GetSigningKeyByIdHandler';
import { SearchSigningKeysHandler } from './SearchSigningKeysHandler';

export default async function registerSigningKeyAdminUseCases(container: AwilixContainer) {
  container.register({
    createNewSigningKeyHandler: asClass(CreateNewSigningKeyHandler).singleton(),
    deleteSigningKeyHandler: asClass(DeleteSigningKeyHandler).singleton(),

    getSigningKeyByIdHandler: asClass(GetSigningKeyByIdHandler).singleton(),
    searchSigningKeysHandler: asClass(SearchSigningKeysHandler).singleton(),
  });
}
