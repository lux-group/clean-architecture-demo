import { EventPublisher, PasswordVerifier, SessionConfig } from "~/app/shared/adapters"
import { CreateSessionProps, Session } from "~/domain/entities"
import { AuthenticationError } from "~/domain/errors"
import { AuthenticationEvent, SessionEvent } from "~/domain/events"
import { SessionRepository, UserRepository } from "~/domain/repositories"
import { AuthenticationService } from "~/domain/services"

export interface SignInWithPasswordCommand {
  brand: string
  email: string
  password: string
}

export class SignInWithPasswordHandler {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly eventPublisher: EventPublisher,
    private readonly passwordVerifier: PasswordVerifier,
    private readonly sessionConfig: SessionConfig,
    private readonly sessionRepository: SessionRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: SignInWithPasswordCommand): Promise<Session> {
    try {
      let user = await this.userRepository.tryGetByBrandAndEmail(command.brand, command.email)

      user = this.authenticationService.authenticateWithPassword(
        user,
        command.password,
        this.passwordVerifier.verifyPassword,
      )

      const props: CreateSessionProps = {
        userId: user.id,
        identityProviderId: null,
        identityProviderSessionId: null,
        idToken: null,
        refreshToken: null,
      }

      const session = Session.createNew(props, this.sessionConfig.localSessionLifetimeHours)
      await this.sessionRepository.insert(session)

      this.eventPublisher.publishEvent(AuthenticationEvent.passwordVerified(user.id))
      this.eventPublisher.publishEvent(SessionEvent.sessionCreated(session))

      return session
    } catch (error: unknown) {
      if (error instanceof AuthenticationError) {
        this.eventPublisher.publishEvent(error.toEvent())
      }

      throw error
    }
  }
}
