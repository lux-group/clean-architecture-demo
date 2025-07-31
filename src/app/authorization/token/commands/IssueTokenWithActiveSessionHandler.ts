import { User } from "~/domain/entities"
import { UserRepository } from "~/domain/repositories"
import { InvalidOperationError } from "~/domain/errors"
import { AuthenticationService, AuthorizationService, SessionService } from "~/domain/services"

export interface IssueTokenWithActiveSessionInput {
  sessionId: string
  nonce: string
  userToImpersonateId?: string
  audience?: string
  scope?: string
}

export interface IssueTokenWithActiveSessionResult {
  accessToken: string
  expiresIn: number
}

export class IssueTokenWithActiveSessionHandler {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly authorizationService: AuthorizationService,
    private readonly sessionService: SessionService,
    private readonly userRepository: UserRepository,
  ) { }

  async execute(command: IssueTokenWithActiveSessionInput): Promise<IssueTokenWithActiveSessionResult> {
    const session = await this.sessionService.getActiveSessionById(
      command.sessionId,
      command.nonce)

    await this.sessionService.refreshSession(session)

    let user: User = await this.authenticationService.authenticateWithActiveSession(session)

    // Handle optional user impersonation
    let impersonatedByUser: User | undefined

    if (command.userToImpersonateId) {
      const userToImpersonate = await this.userRepository.tryGetById(command.userToImpersonateId)
      if (!userToImpersonate) {
        throw new InvalidOperationError(`User with id ${command.userToImpersonateId} not found`)
      }

      impersonatedByUser = user
      user = userToImpersonate
    }

    const accessToken = await this.authorizationService.issueAccessToken(
      user,
      impersonatedByUser,
      session,
      command.audience,
      command.scope)

    return accessToken
  }
}
