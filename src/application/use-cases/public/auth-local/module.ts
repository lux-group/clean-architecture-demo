import { AwilixContainer, asFunction } from 'awilix';
import { signInWithPassword } from './SignInWithPassword';
import { signOut } from './SignOut';

export default async function registerLocalAuthUseCases(container: AwilixContainer) {
  container.register({
    signInWithPassword: asFunction(signInWithPassword).singleton(),
    signOut: asFunction(signOut).singleton(),
  });
}
