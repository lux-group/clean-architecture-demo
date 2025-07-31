import { SessionService } from "~/domain/services"

export interface SignOutCommand {
  sessionId: string
  nonce: string
}

export class SignOutHandler {
  constructor(
    private readonly sessionService: SessionService,
  ) {}

  async execute(command: SignOutCommand): Promise<void> {
    const session = await this.sessionService.getActiveSessionById(command.sessionId, command.nonce)
    await this.sessionService.terminateLocalSessionByUser(session)
  }
}
