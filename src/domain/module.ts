import { AwilixContainer, asClass } from 'awilix';
import { AuthenticationService, AuthorizationService } from './services';

export default async function registerDomainServices(container: AwilixContainer) {
  container.register({
    authenticationService: asClass(AuthenticationService).singleton(),
    authorizationService: asClass(AuthorizationService).singleton(),
  });
}
