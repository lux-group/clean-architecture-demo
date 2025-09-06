import { EventPublisher, PasswordVerifier } from "~/domain/adapters"
import { CreateSessionProps, Session } from "~/domain/entities"
import { AuthenticationError, commonErrors } from "~/domain/errors"
import { AuthenticationEvent, SessionEvent } from "~/domain/events"
import { SessionRepository, UserRepository } from "~/domain/repositories"
import { SessionConfig } from "~/infrastructure/config"

export interface SignInWithPasswordCommand {
  brand: string
  email: string
  password: string
}

export class SignInWithPasswordHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly sessionConfig: SessionConfig,
    private readonly passwordVerifier: PasswordVerifier,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: SignInWithPasswordCommand): Promise<Session> {
    const user = await this.authenticateUser(command.brand, command.email, command.password)
    return await this.createSession(user.id)
  }

  private async authenticateUser(brand: string, email: string, password: string) {
    const user = await this.userRepository.tryGetByBrandAndEmail(brand, email)

    if (!user) {
      this.eventPublisher.publishEvent(AuthenticationEvent.passwordFailed())
      throw new AuthenticationError(commonErrors.authenticationFailed)
    }

    if (!user.canSignInWithPassword()) {
      this.eventPublisher.publishEvent(AuthenticationEvent.passwordMethodNotAllowed(user))
      throw new AuthenticationError(commonErrors.authenticationMethodNotAllowed)
    }

    if (!user.passwordHash || !this.passwordVerifier.verifyPassword(password, user.passwordHash)) {
      user.handleFailedSignInAttempt()
      this.eventPublisher.publishEvent(AuthenticationEvent.passwordFailed(user))
      throw new AuthenticationError(commonErrors.authenticationFailed)
    }

    this.eventPublisher.publishEvent(AuthenticationEvent.passwordSuccess(user))
    return user
  }

  private async createSession(userId: string) {
    const props: CreateSessionProps = {
      userId: userId,
      identityProviderId: null,
      identityProviderSessionId: null,
      idToken: null,
      refreshToken: null,
    }

    const session = Session.createNew(props, this.sessionConfig.localSessionLifetimeHours)
    await this.sessionRepository.insert(session)

    this.eventPublisher.publishEvent(SessionEvent.sessionCreated(session))
    return session
  }
}
