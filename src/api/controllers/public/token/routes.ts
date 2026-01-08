import type { RouterAbstraction } from '@luxuryescapes/router';
import { AwilixContainer } from 'awilix';
import { getJsonWebKeysHandler, getJsonWebKeysSchema } from './getJsonWebKeys';
import { getOpenidConfigurationHandler, getOpenidConfigurationSchema } from './getOpenidConfiguration';
import { getTokenHandler, getTokenSchema } from './getToken';

const mount = (container: AwilixContainer, router: RouterAbstraction, basePath: string): void => {
  router.post({
    url: `${basePath}/token`,
    operationId: 'getToken',
    schema: getTokenSchema,
    preHandlers: [],
    handlers: [container.build(getTokenHandler)],
    summary: 'Get Token',
    description: 'Get an access token using various grant types',
  });

  router.get({
    url: `${basePath}/.well-known/openid-configuration`,
    operationId: 'getOpenidConfiguration',
    schema: getOpenidConfigurationSchema,
    preHandlers: [],
    handlers: [container.build(getOpenidConfigurationHandler)],
    summary: 'Get OpenID Configuration',
    description: 'Get OpenID Connect discovery document',
  });

  router.get({
    url: `${basePath}/.well-known/jwks`,
    operationId: 'getJsonWebKeys',
    schema: getJsonWebKeysSchema,
    preHandlers: [],
    handlers: [container.build(getJsonWebKeysHandler)],
    summary: 'Get JSON Web Keys',
    description: 'Get JSON Web Key Set for token verification',
  });
};

export default { mount };
