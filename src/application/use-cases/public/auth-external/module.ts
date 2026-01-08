import { AwilixContainer, asFunction } from 'awilix';
import { createSignInRequest } from './CreateSignInRequest';
import { createSignOutRequest } from './CreateSignOutRequest';
import { frontChannelSignOut } from './FrontChannelSignOut';
import { processSignInResponse } from './ProcessSignInResponse';

export default async function registerExternalAuthUseCases(container: AwilixContainer) {
  container.register({
    createSignInRequest: asFunction(createSignInRequest).singleton(),
    createSignOutRequest: asFunction(createSignOutRequest).singleton(),
    frontChannelSignOut: asFunction(frontChannelSignOut).singleton(),
    processSignInResponse: asFunction(processSignInResponse).singleton(),
  });
}
