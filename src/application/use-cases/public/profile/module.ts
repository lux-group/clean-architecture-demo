import { AwilixContainer, asClass } from 'awilix';
import { GetProfileByIdHandler } from './GetProfileByIdHandler';

export default async function registerProfileUseCases(container: AwilixContainer) {
  container.register({
    getProfileByIdHandler: asClass(GetProfileByIdHandler).singleton(),
  });
}
