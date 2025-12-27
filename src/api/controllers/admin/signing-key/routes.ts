import type { RouterAbstraction } from '@luxuryescapes/router';
import { AwilixContainer } from 'awilix';
import { authorizeMiddlewareFactory } from '~/api/middleware/authorize';
import { createSigningKeyHandler, createSigningKeySchema } from './createSigningKey';
import { deleteSigningKeyHandler, deleteSigningKeySchema } from './deleteSigningKey';
import { getSigningKeyByIdHandler, getSigningKeyByIdSchema } from './getSigningKeyById';
import { searchSigningKeysHandler, searchSigningKeysSchema } from './searchSigningKeys';

const mount = (container: AwilixContainer, router: RouterAbstraction, basePath: string): void => {
  const authorize = container.build(authorizeMiddlewareFactory);

  router.get({
    url: `${basePath}/signing-keys`,
    operationId: 'searchSigningKeys',
    schema: searchSigningKeysSchema,
    preHandlers: [authorize({ scopes: ['signing-key:read', 'signing-key:write'] })],
    handlers: [container.build(searchSigningKeysHandler)],
    summary: 'Search Signing Keys',
    description: 'Search for signing keys',
  });

  router.get({
    url: `${basePath}/signing-keys/:id`,
    operationId: 'getSigningKeyById',
    schema: getSigningKeyByIdSchema,
    preHandlers: [authorize({ scopes: ['signing-key:read', 'signing-key:write'] })],
    handlers: [container.build(getSigningKeyByIdHandler)],
    summary: 'Get Signing Key',
    description: 'Get a signing key by ID',
  });

  router.post({
    url: `${basePath}/signing-keys`,
    operationId: 'createSigningKey',
    schema: createSigningKeySchema,
    preHandlers: [authorize({ scopes: ['signing-key:write'] })],
    handlers: [container.build(createSigningKeyHandler)],
    summary: 'Create Signing Key',
    description: 'Create a new signing key',
  });

  router.delete({
    url: `${basePath}/signing-keys/:id`,
    operationId: 'deleteSigningKey',
    schema: deleteSigningKeySchema,
    preHandlers: [authorize({ scopes: ['signing-key:write'] })],
    handlers: [container.build(deleteSigningKeyHandler)],
    summary: 'Delete Signing Key',
    description: 'Delete a signing key',
  });
};

export default { mount };
