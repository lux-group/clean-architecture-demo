import { SessionService } from "~/domain/services"

export interface FrontChannelSignOutInput {
  sid: string
}

export class FrontChannelSignOutUseCase {
  constructor(
    private readonly sessionService: SessionService,
  ) {}

  async execute(input: FrontChannelSignOutInput): Promise<void> {
    const session = await this.sessionService.tryGetSessionByIdentityProviderSessionId(input.sid)
    if (session) {
      await this.sessionService.terminateSessionByIdentityProvider(session)
    }
  }
}
