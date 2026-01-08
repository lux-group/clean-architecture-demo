import type { RouterAbstraction } from '@luxuryescapes/router';
import { AwilixContainer } from 'awilix';
import { authorizeMiddlewareFactory } from '~/api/middleware/authorize';
import { getProfileHandler, getProfileSchema } from './getProfile';

const mount = (container: AwilixContainer, router: RouterAbstraction, basePath: string): void => {
  const authorize = container.build(authorizeMiddlewareFactory);

  router.get({
    url: `${basePath}/profiles`,
    operationId: 'getProfile',
    schema: getProfileSchema,
    preHandlers: [authorize()],
    handlers: [container.build(getProfileHandler)],
    summary: 'Get Profile',
    description: 'Get the current user profile',
  });
};

export default { mount };
