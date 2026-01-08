import { AwilixContainer, asFunction } from 'awilix';
import { getProfileById } from './GetProfileById';

export default async function registerProfileUseCases(container: AwilixContainer) {
  container.register({
    getProfileById: asFunction(getProfileById).singleton(),
  });
}
