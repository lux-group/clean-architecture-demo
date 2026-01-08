import type { RouterAbstraction } from '@luxuryescapes/router';
import { AwilixContainer } from 'awilix';
import { signInWithPasswordHandler, signInWithPasswordSchema } from './signInWithPassword';
import { signOutHandler, signOutSchema } from './signOut';

const mount = (container: AwilixContainer, router: RouterAbstraction, basePath: string): void => {
  router.post({
    url: `${basePath}/local/sign-in`,
    operationId: 'signInWithPassword',
    schema: signInWithPasswordSchema,
    preHandlers: [],
    handlers: [container.build(signInWithPasswordHandler)],
    summary: 'Sign In With Password',
    description: 'Authenticate user with email and password',
  });

  router.post({
    url: `${basePath}/local/sign-out`,
    operationId: 'signOut',
    schema: signOutSchema,
    preHandlers: [],
    handlers: [container.build(signOutHandler)],
    summary: 'Sign Out',
    description: 'Sign out and terminate session',
  });
};

export default { mount };
