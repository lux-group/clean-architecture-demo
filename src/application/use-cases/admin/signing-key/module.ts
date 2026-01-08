import { AwilixContainer, asFunction } from 'awilix';
import { createNewSigningKey } from './CreateNewSigningKey';
import { deleteSigningKey } from './DeleteSigningKey';
import { getSigningKeyById } from './GetSigningKeyById';
import { searchSigningKeys } from './SearchSigningKeys';

export default async function registerSigningKeyAdminUseCases(container: AwilixContainer) {
  container.register({
    createNewSigningKey: asFunction(createNewSigningKey).singleton(),
    deleteSigningKey: asFunction(deleteSigningKey).singleton(),
    getSigningKeyById: asFunction(getSigningKeyById).singleton(),
    searchSigningKeys: asFunction(searchSigningKeys).singleton(),
  });
}
