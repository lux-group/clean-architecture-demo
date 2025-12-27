import type { RouterAbstraction } from '@luxuryescapes/router';
import { AwilixContainer } from 'awilix';
import { createSignInRequestHandler, createSignInRequestSchema } from './createSignInRequest';
import { createSignOutRequestHandler, createSignOutRequestSchema } from './createSignOutRequest';
import { frontChannelSignOutHandler, frontChannelSignOutSchema } from './frontChannelSignOut';
import { processSignInResponseHandler, processSignInResponseSchema } from './processSignInResponse';
import { processSignOutResponseHandler, processSignOutResponseSchema } from './processSignOutResponse';

const mount = (container: AwilixContainer, router: RouterAbstraction, basePath: string): void => {
  router.get({
    url: `${basePath}/external/sign-in`,
    operationId: 'createSignInRequest',
    schema: createSignInRequestSchema,
    preHandlers: [],
    handlers: [container.build(createSignInRequestHandler)],
    summary: 'Create Sign In Request',
    description: 'Initiates external identity provider sign-in flow',
  });

  router.get({
    url: `${basePath}/external/sign-in-callback`,
    operationId: 'processSignInResponse',
    schema: processSignInResponseSchema as any,
    preHandlers: [],
    handlers: [container.build(processSignInResponseHandler)],
    summary: 'Process Sign In Response',
    description: 'Handles callback from external identity provider after sign-in',
  });

  router.get({
    url: `${basePath}/external/sign-out`,
    operationId: 'createSignOutRequest',
    schema: createSignOutRequestSchema,
    preHandlers: [],
    handlers: [container.build(createSignOutRequestHandler)],
    summary: 'Create Sign Out Request',
    description: 'Initiates external identity provider sign-out flow',
  });

  router.get({
    url: `${basePath}/external/sign-out-callback`,
    operationId: 'processSignOutResponse',
    schema: processSignOutResponseSchema as any,
    preHandlers: [],
    handlers: [container.build(processSignOutResponseHandler)],
    summary: 'Process Sign Out Response',
    description: 'Handles callback from external identity provider after sign-out',
  });

  router.get({
    url: `${basePath}/external/frontchannel-sign-out`,
    operationId: 'frontChannelSignOut',
    schema: frontChannelSignOutSchema,
    preHandlers: [],
    handlers: [container.build(frontChannelSignOutHandler)],
    summary: 'Front Channel Sign Out',
    description: 'Handles front-channel sign-out request from identity provider',
  });
};

export default { mount };
