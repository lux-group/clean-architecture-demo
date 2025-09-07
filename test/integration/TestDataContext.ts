import { AwilixContainer } from "awilix"
import { DeepPartial } from "~/lib/types"

import { IdentityProviderRepository, SessionRepository, SigningKeyRepository, UserRepository } from "~/domain/repositories"
import { CreateIdentityProviderProps, CreateSessionProps, CreateSigningKeyProps, CreateUserProps, Session } from "~/domain/entities"
import { PasswordVerifier } from "~/app/ports"
import { SecureCookieManager } from "~/app/shared/utils/SecureCookieManager"
import * as factories from "../factories"

export class TestDataContext {
  constructor(private container: AwilixContainer) {}

  getIdentityProvider = async (id: string) => {
    const repository = this.container.resolve<IdentityProviderRepository>("identityProviderRepository")
    return await repository.getById(id)
  }

  getSession = async (id: string) => {
    const repository = this.container.resolve<SessionRepository>("sessionRepository")
    return await repository.getById(id)
  }

  getSigningKey = async (id: string) => {
    const repository = this.container.resolve<SigningKeyRepository>("signingKeyRepository")
    return await repository.getById(id)
  }

  getUser = async (id: string) => {
    const repository = this.container.resolve<UserRepository>("userRepository")
    return await repository.getById(id)
  }

  createIdentityProvider = async (props: DeepPartial<CreateIdentityProviderProps> = {}) => {
    const identityProvider = factories.createIdentityProvider(props)
    const repository = this.container.resolve<IdentityProviderRepository>("identityProviderRepository")
    await repository.insert(identityProvider)
    return identityProvider
  }

  identityProviderExists = async (id: string) => {
    const repository = this.container.resolve<IdentityProviderRepository>("identityProviderRepository")
    return !!await repository.tryGetById(id)
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

  userExists = async (id: string) => {
    const repository = this.container.resolve<UserRepository>("userRepository")
    return !!await repository.tryGetById(id)
  }

  createSigningKey = async (props: Partial<CreateSigningKeyProps> = {}) => {
    const signingKey = factories.createSigningKey(props)
    const repository = this.container.resolve<SigningKeyRepository>("signingKeyRepository")
    await repository.insert(signingKey)
    return signingKey
  }

  signingKeyExists = async (id: string) => {
    const repository = this.container.resolve<SigningKeyRepository>("signingKeyRepository")
    return !!await repository.tryGetById(id)
  }

  getActiveSigningKey = async () => {
    const repository = this.container.resolve<SigningKeyRepository>("signingKeyRepository")
    let signingKey = await repository.tryGetActiveSigningKey()
    if (!signingKey) {
      signingKey = await this.createSigningKey()
    }
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
