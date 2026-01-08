import { AwilixContainer, asFunction } from 'awilix';
import { createIdentityProvider } from './CreateIdentityProvider';
import { deleteIdentityProvider } from './DeleteIdentityProvider';
import { getIdentityProviderById } from './GetIdentityProviderById';
import { searchIdentityProviders } from './SearchIdentityProviders';
import { updateIdentityProvider } from './UpdateIdentityProvider';

export default async function registerIdentityProviderAdminUseCases(container: AwilixContainer) {
  container.register({
    createIdentityProvider: asFunction(createIdentityProvider).singleton(),
    deleteIdentityProvider: asFunction(deleteIdentityProvider).singleton(),
    getIdentityProviderById: asFunction(getIdentityProviderById).singleton(),
    searchIdentityProviders: asFunction(searchIdentityProviders).singleton(),
    updateIdentityProvider: asFunction(updateIdentityProvider).singleton(),
  });
}
