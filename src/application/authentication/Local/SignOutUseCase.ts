import { SessionService } from "~/domain/services"

export interface SignOutInput {
  sessionId: string
  nonce: string
}

export class SignOutUseCase {
  constructor(
    private readonly sessionService: SessionService,
  ) {}

  async execute(input: SignOutInput): Promise<void> {
    const session = await this.sessionService.getActiveSessionById(input.sessionId, input.nonce)
    await this.sessionService.terminateLocalSessionByUser(session)
  }
}
