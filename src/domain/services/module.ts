import { asClass, AwilixContainer } from "awilix"
import { AuthenticationService, AuthorizationService, SessionService } from "."

export default function registerDomainServices(container: AwilixContainer) {
  container.register({
    authenticationService: asClass(AuthenticationService).singleton(),
    authorizationService: asClass(AuthorizationService).singleton(),
    sessionService: asClass(SessionService).singleton(),
  })
}
