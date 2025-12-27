import { AwilixContainer } from 'awilix';
import registerIdentityProviderAdminUseCases from './use-cases/admin/identity-provider/module';
import registerSessionAdminUseCases from './use-cases/admin/session/module';
import registerSigningKeyAdminUseCases from './use-cases/admin/signing-key/module';
import registerUserAdminUseCases from './use-cases/admin/user/module';
import registerExternalAuthUseCases from './use-cases/public/auth-external/module';
import registerLocalAuthUseCases from './use-cases/public/auth-local/module';
import registerProfileUseCases from './use-cases/public/profile/module';
import registerTokenUseCases from './use-cases/public/token/module';

export default async function registerApplicationServices(container: AwilixContainer) {
  await registerIdentityProviderAdminUseCases(container);
  await registerSessionAdminUseCases(container);
  await registerSigningKeyAdminUseCases(container);
  await registerUserAdminUseCases(container);

  await registerExternalAuthUseCases(container);
  await registerLocalAuthUseCases(container);
  await registerProfileUseCases(container);
  await registerTokenUseCases(container);
}
