import { User } from "~/domain/entities"
import { UserRepository } from "~/domain/repositories"
import { InvalidOperationError } from "~/domain/errors"
import { AuthenticationService, AuthorizationService, SessionService } from "~/domain/services"

export interface GetTokenWithActiveSessionInput {
  sessionId: string
  nonce: string
  userToImpersonateId?: string
  audience?: string
  scope?: string
}

export interface GetTokenWithActiveSessionOutput {
  accessToken: string
  expiresIn: number
}

export class GetTokenWithActiveSessionUseCase {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly authorizationService: AuthorizationService,
    private readonly sessionService: SessionService,
    private readonly userRepository: UserRepository,
  ) { }

  async execute(input: GetTokenWithActiveSessionInput): Promise<GetTokenWithActiveSessionOutput> {
    const session = await this.sessionService.getActiveSessionById(
      input.sessionId,
      input.nonce)

    await this.sessionService.refreshSession(session)

    let user: User = await this.authenticationService.authenticateWithActiveSession(session)

    // Handle optional user impersonation
    let impersonatedByUser: User | undefined

    if (input.userToImpersonateId) {
      const userToImpersonate = await this.userRepository.tryGetById(input.userToImpersonateId)
      if (!userToImpersonate) {
        throw new InvalidOperationError(`User with id ${input.userToImpersonateId} not found`)
      }

      impersonatedByUser = user
      user = userToImpersonate
    }

    const accessToken = await this.authorizationService.issueAccessToken(
      user,
      impersonatedByUser,
      session,
      input.audience,
      input.scope)

    return accessToken
  }
}
