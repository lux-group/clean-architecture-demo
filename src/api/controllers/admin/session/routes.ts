import type { RouterAbstraction } from '@luxuryescapes/router';
import { AwilixContainer } from 'awilix';
import { authorizeMiddlewareFactory } from '~/api/middleware/authorize';
import { getSessionByIdHandler, getSessionByIdSchema } from './getSessionById';
import { searchSessionsHandler, searchSessionsSchema } from './searchSessions';
import { terminateSessionHandler, terminateSessionSchema } from './terminateSession';

const mount = (container: AwilixContainer, router: RouterAbstraction, basePath: string): void => {
  const authorize = container.build(authorizeMiddlewareFactory);

  router.get({
    url: `${basePath}/sessions`,
    operationId: 'searchSessions',
    schema: searchSessionsSchema,
    preHandlers: [authorize({ scopes: ['session:read', 'session:write'] })],
    handlers: [container.build(searchSessionsHandler)],
    summary: 'Search Sessions',
    description: 'Search for sessions',
  });

  router.get({
    url: `${basePath}/sessions/:id`,
    operationId: 'getSessionById',
    schema: getSessionByIdSchema,
    preHandlers: [authorize({ scopes: ['session:read', 'session:write'] })],
    handlers: [container.build(getSessionByIdHandler)],
    summary: 'Get Session',
    description: 'Get a session by ID',
  });

  router.post({
    url: `${basePath}/sessions/:id/terminate`,
    operationId: 'terminateSession',
    schema: terminateSessionSchema,
    preHandlers: [authorize({ scopes: ['session:write'] })],
    handlers: [container.build(terminateSessionHandler)],
    summary: 'Terminate Session',
    description: 'Terminate a session by ID',
  });
};

export default { mount };
