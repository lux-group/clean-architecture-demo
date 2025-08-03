import { AwilixContainer } from "awilix"
import { IdentityProviderRepository, SessionRepository, SigningKeyRepository, UserRepository } from "~/domain/repositories"
import { CreateIdentityProviderProps, CreateSessionProps, CreateSigningKeyProps, CreateUserProps, Session } from "~/domain/entities"
import { PasswordVerifier } from "~/domain/adapters"
import { SecureCookieManager } from "~/app/shared/utils/SecureCookieManager"
import * as factories from "../factories"

export class TestDataContext {
  constructor(private container: AwilixContainer) {}

  getIdentityProvider = async (id: string) => {
    const repository = this.container.resolve<IdentityProviderRepository>("identityProviderRepository")
    return repository.getById(id)
  }

  getSession = async (id: string) => {
    const repository = this.container.resolve<SessionRepository>("sessionRepository")
    return repository.getById(id)
  }

  getUser = async (id: string) => {
    const repository = this.container.resolve<UserRepository>("userRepository")
    return repository.getById(id)
  }

  createIdentityProvider = async (props: Partial<CreateIdentityProviderProps> = {}) => {
    const identityProvider = factories.createIdentityProvider(props)
    const repository = this.container.resolve<IdentityProviderRepository>("identityProviderRepository")
    await repository.insert(identityProvider)
    return identityProvider
  }

  createSession = async (props: Partial<CreateSessionProps> & { userId: string }, hours: number) => {
    const session = factories.createLocalSession(props, hours)
    const repository = this.container.resolve<SessionRepository>("sessionRepository")
    await repository.insert(session)
    return session
  }

  createUser = async (props: Partial<CreateUserProps & { password?: string }> = {}) => {
    if (props.password) {
      const passwordVerifier = this.container.resolve<PasswordVerifier>("passwordVerifier")
      props = { ...props, passwordHash: passwordVerifier.createPasswordHash(props.password) }
      delete props.password
    }

    const user = factories.createUser(props)
    const repository = this.container.resolve<UserRepository>("userRepository")
    await repository.insert(user)
    return user
  }

  createSigningKey = async (props: Partial<CreateSigningKeyProps> = {}) => {
    const signingKey = factories.createSigningKey(props)
    const repository = this.container.resolve<SigningKeyRepository>("signingKeyRepository")
    await repository.insert(signingKey)
    return signingKey
  }

  createAuthStateCookie = (redirectUrl: string, identityProviderId: string) => {
    const secureCookieManager = this.container.resolve<SecureCookieManager>("secureCookieManager")
    const payload = { redirectUrl, identityProviderId }
    const headers = { "accept-language": "", "user-agent": "" }
    return secureCookieManager.encryptCookie(payload, headers)
  }

  createAuthSessionCookie = (session: Session) => {
    const secureCookieManager = this.container.resolve<SecureCookieManager>("secureCookieManager")
    const payload = { id: session.id, nonce: session.nonce }
    const headers = { "accept-language": "", "user-agent": "" }
    return secureCookieManager.encryptCookie(payload, headers)
  }
}