import { AwilixContainer, asClass } from 'awilix';
import { GetSessionByIdHandler } from './GetSessionByIdHandler';
import { SearchSessionsHandler } from './SearchSessionsHandler';
import { TerminateSessionHandler } from './TerminateSessionHandler';

export default async function registerSessionAdminUseCases(container: AwilixContainer) {
  container.register({
    terminateSessionHandler: asClass(TerminateSessionHandler).singleton(),
    getSessionByIdHandler: asClass(GetSessionByIdHandler).singleton(),
    searchSessionsHandler: asClass(SearchSessionsHandler).singleton(),
  });
}
