import type { RouterAbstraction } from '@luxuryescapes/router';
import { AwilixContainer } from 'awilix';
import { authorizeMiddlewareFactory } from '~/api/middleware/authorize';
import { createUserHandler, createUserSchema } from './createUser';
import { deleteUserHandler, deleteUserSchema } from './deleteUser';
import { getUserByIdHandler, getUserByIdSchema } from './getUserById';
import { searchUsersHandler, searchUsersSchema } from './searchUsers';
import { updateUserHandler, updateUserSchema } from './updateUser';

const mount = (container: AwilixContainer, router: RouterAbstraction, basePath: string): void => {
  const authorize = container.build(authorizeMiddlewareFactory);

  router.get({
    url: `${basePath}/users`,
    operationId: 'searchUsers',
    schema: searchUsersSchema,
    preHandlers: [authorize({ scopes: ['user:read', 'user:write'] })],
    handlers: [container.build(searchUsersHandler)],
    summary: 'Search Users',
    description: 'Search for users',
  });

  router.get({
    url: `${basePath}/users/:id`,
    operationId: 'getUserById',
    schema: getUserByIdSchema,
    preHandlers: [authorize({ scopes: ['user:read', 'user:write'] })],
    handlers: [container.build(getUserByIdHandler)],
    summary: 'Get User',
    description: 'Get a user by ID',
  });

  router.post({
    url: `${basePath}/users`,
    operationId: 'createUser',
    schema: createUserSchema,
    preHandlers: [authorize({ scopes: ['user:write'] })],
    handlers: [container.build(createUserHandler)],
    summary: 'Create User',
    description: 'Create a new user',
  });

  router.put({
    url: `${basePath}/users/:id`,
    operationId: 'updateUser',
    schema: updateUserSchema,
    preHandlers: [authorize({ scopes: ['user:write'] })],
    handlers: [container.build(updateUserHandler)],
    summary: 'Update User',
    description: 'Update a user',
  });

  router.delete({
    url: `${basePath}/users/:id`,
    operationId: 'deleteUser',
    schema: deleteUserSchema,
    preHandlers: [authorize({ scopes: ['user:write'] })],
    handlers: [container.build(deleteUserHandler)],
    summary: 'Delete User',
    description: 'Delete a user',
  });
};

export default { mount };
