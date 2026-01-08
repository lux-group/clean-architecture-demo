import type { RouterAbstraction } from '@luxuryescapes/router';
import { AwilixContainer } from 'awilix';
import { authorizeMiddlewareFactory } from '~/api/middleware/authorize';
import { createIdentityProviderHandler, createIdentityProviderSchema } from './createIdentityProvider';
import { deleteIdentityProviderHandler, deleteIdentityProviderSchema } from './deleteIdentityProvider';
import { getIdentityProviderByIdHandler, getIdentityProviderByIdSchema } from './getIdentityProviderById';
import { searchIdentityProvidersHandler, searchIdentityProvidersSchema } from './searchIdentityProviders';
import { updateIdentityProviderHandler, updateIdentityProviderSchema } from './updateIdentityProvider';

const mount = (container: AwilixContainer, router: RouterAbstraction, basePath: string): void => {
  const authorize = container.build(authorizeMiddlewareFactory);

  router.get({
    url: `${basePath}/identity-providers`,
    operationId: 'searchIdentityProviders',
    schema: searchIdentityProvidersSchema,
    preHandlers: [authorize({ scopes: ['identity-provider:read', 'identity-provider:write'] })],
    handlers: [container.build(searchIdentityProvidersHandler)],
    summary: 'Search Identity Providers',
    description: 'Search for identity providers',
  });

  router.get({
    url: `${basePath}/identity-providers/:id`,
    operationId: 'getIdentityProviderById',
    schema: getIdentityProviderByIdSchema,
    preHandlers: [authorize({ scopes: ['identity-provider:read', 'identity-provider:write'] })],
    handlers: [container.build(getIdentityProviderByIdHandler)],
    summary: 'Get Identity Provider',
    description: 'Get an identity provider by ID',
  });

  router.post({
    url: `${basePath}/identity-providers`,
    operationId: 'createIdentityProvider',
    schema: createIdentityProviderSchema,
    preHandlers: [authorize({ scopes: ['identity-provider:write'] })],
    handlers: [container.build(createIdentityProviderHandler)],
    summary: 'Create Identity Provider',
    description: 'Create a new identity provider',
  });

  router.put({
    url: `${basePath}/identity-providers/:id`,
    operationId: 'updateIdentityProvider',
    schema: updateIdentityProviderSchema,
    preHandlers: [authorize({ scopes: ['identity-provider:write'] })],
    handlers: [container.build(updateIdentityProviderHandler)],
    summary: 'Update Identity Provider',
    description: 'Update an identity provider',
  });

  // Support PATCH as an alias for update for compatibility
  router.patch({
    url: `${basePath}/identity-providers/:id`,
    operationId: 'updateIdentityProvider',
    schema: updateIdentityProviderSchema,
    preHandlers: [authorize({ scopes: ['identity-provider:write'] })],
    handlers: [container.build(updateIdentityProviderHandler)],
    summary: 'Update Identity Provider',
    description: 'Update an identity provider',
  });

  router.delete({
    url: `${basePath}/identity-providers/:id`,
    operationId: 'deleteIdentityProvider',
    schema: deleteIdentityProviderSchema,
    preHandlers: [authorize({ scopes: ['identity-provider:write'] })],
    handlers: [container.build(deleteIdentityProviderHandler)],
    summary: 'Delete Identity Provider',
    description: 'Delete an identity provider',
  });
};

export default { mount };
