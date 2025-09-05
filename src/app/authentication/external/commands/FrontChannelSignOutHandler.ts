import { SessionService } from "~/domain/services"

export interface FrontChannelSignOutCommand {
  sid: string
}

export class FrontChannelSignOutHandler {
  constructor(private readonly sessionService: SessionService) {}

  async execute(command: FrontChannelSignOutCommand): Promise<void> {
    const session = await this.sessionService.tryGetSessionByIdentityProviderSessionId(command.sid)
    if (session) {
      await this.sessionService.terminateSessionByIdentityProvider(session)
    }
  }
}
