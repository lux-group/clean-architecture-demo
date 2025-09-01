import { Session } from "~/domain/entities"
import { SessionService, AuthenticationService } from "~/domain/services"

export interface SignInWithPasswordCommand {
  brand: string
  email: string
  password: string
}

export class SignInWithPasswordHandler {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly sessionService: SessionService,
  ) {}

  async execute(command: SignInWithPasswordCommand): Promise<Session> {
    const user = await this.authenticationService.authenticateWithEmailAndPassword(
      command.brand,
      command.email,
      command.password)

    const session = await this.sessionService.startLocalSession(user.id)

    return session
  }
}
