import { AwilixContainer, asClass } from 'awilix';
import { CreateSignInRequestHandler } from './CreateSignInRequestHandler';
import { CreateSignOutRequestHandler } from './CreateSignOutRequestHandler';
import { FrontChannelSignOutHandler } from './FrontChannelSignOutHandler';
import { ProcessSignInResponseHandler } from './ProcessSignInResponseHandler';

export default async function registerExternalAuthUseCases(container: AwilixContainer) {
  container.register({
    createSignInRequestHandler: asClass(CreateSignInRequestHandler).singleton(),
    createSignOutRequestHandler: asClass(CreateSignOutRequestHandler).singleton(),
    frontChannelSignOutHandler: asClass(FrontChannelSignOutHandler).singleton(),
    processSignInResponseHandler: asClass(ProcessSignInResponseHandler).singleton(),
  });
}
