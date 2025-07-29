import { Session } from "~/domain/entities"
import { SessionService, AuthenticationService } from "~/domain/services"

export interface SignInWithPasswordInput {
  brand: string
  email: string
  password: string
}

/**
 * Application service that orchestrates the sign-in process.
 * Contains no business logic - only orchestration of domain services.
 * 
 * This demonstrates proper Clean Architecture where:
 * - Application layer orchestrates domain services
 * - Business logic remains in domain layer
 * - Infrastructure concerns are abstracted through interfaces
 */
export class SignInWithPasswordUseCase {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly sessionService: SessionService,
  ) {}

  async execute(input: SignInWithPasswordInput): Promise<Session> {
    const user = await this.authenticationService.authenticateWithEmailAndPassword(
      input.brand,
      input.email,
      input.password)

    const session = await this.sessionService.startLocalSession(user.id)

    return session
  }
}
