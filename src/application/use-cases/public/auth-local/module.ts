import { AwilixContainer, asClass } from 'awilix';
import { SignInWithPasswordHandler } from './SignInWithPasswordHandler';
import { SignOutHandler } from './SignOutHandler';

export default async function registerLocalAuthUseCases(container: AwilixContainer) {
  container.register({
    signInWithPasswordHandler: asClass(SignInWithPasswordHandler).singleton(),
    signOutHandler: asClass(SignOutHandler).singleton(),
  });
}
