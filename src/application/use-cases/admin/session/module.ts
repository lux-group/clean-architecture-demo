import { AwilixContainer, asFunction } from 'awilix';
import { getSessionById } from './GetSessionById';
import { searchSessions } from './SearchSessions';
import { terminateSession } from './TerminateSession';

export default async function registerSessionAdminUseCases(container: AwilixContainer) {
  container.register({
    terminateSession: asFunction(terminateSession).singleton(),
    getSessionById: asFunction(getSessionById).singleton(),
    searchSessions: asFunction(searchSessions).singleton(),
  });
}
