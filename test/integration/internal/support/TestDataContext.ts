import { randomUUID } from "crypto"
import { AwilixContainer } from "awilix"
import { IdentityProviderRepository, SessionRepository, UserRepository } from "~/domain/repositories"
import { CreateIdentityProviderProps, CreateSessionProps, CreateUserProps, IdentityProvider, Session, User } from "~/domain/entities"
import { PasswordVerifier } from "~/domain/adapters"
import { SecureCookieManager } from "~/api/utils/SecureCookieManager"
import { CreateNewSigningKeyUseCase } from "~/application/admin/signing-key/CreateNewSigningKeyUseCase"

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

  createIdentityProvider = async (props: Partial<CreateIdentityProviderProps>) => {
    const identityProvider = IdentityProvider.createNew({
      name: randomUUID(),
      issuerUrl: "https://login.test.com",
      audience: randomUUID(),
      identifierClaimName: "sub",
      ...props,
      authSettings: {
        type: "ENTRA",
        brand: "Test Brand",
        clientId: randomUUID(),
        clientSecret: randomUUID(),
        redirectUrls: [this.container.resolve<string>("baseUrl")],
        autoLinkUsers: true,
        autoCreateUsers: true,
        ...props.authSettings,
      }
    })

    const repository = this.container.resolve<IdentityProviderRepository>("identityProviderRepository")
    await repository.insert(identityProvider)
    return identityProvider
  }

  createSession = async (props: Partial<CreateSessionProps>, hours: number) => {
    const session = Session.createNew({
      userId: randomUUID(),
      identityProviderId: null,
      identityProviderSessionId: randomUUID(),
      idToken: randomUUID(),
      refreshToken: randomUUID(),
      ...props,
    }, hours)

    const repository = this.container.resolve<SessionRepository>("sessionRepository")
    await repository.insert(session)
    return session
  }

  createUser = async (props: Partial<CreateUserProps & { password: string }>) => {
    if (props.password) {
      const passwordVerifier = this.container.resolve<PasswordVerifier>("passwordVerifier")
      props = { ...props, passwordHash: passwordVerifier.createPasswordHash(props.password) }
      delete props.password
    }

    const user = User.createNew({
      isEnabled: true,
      brand: "Test Brand",
      givenName: randomUUID(),
      surname: randomUUID(),
      email: `${randomUUID()}@example.com`,
      emailVerified: false,
      phone: null,
      country: null,
      city: null,
      postcode: null,
      passwordHash: null,
      roles: [],
      ...props,
    })

    const repository = this.container.resolve<UserRepository>("userRepository")
    await repository.insert(user)
    return user
  }

  createSigningKey = async () => {
    await this.container
      .resolve<CreateNewSigningKeyUseCase>("createNewSigningKeyUseCase")
      .execute()    
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