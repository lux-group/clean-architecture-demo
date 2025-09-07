import { AuthClientFactory, EventPublisher, SignOutState } from "~/app/shared/adapters"
import { AuthenticationError } from "~/domain/errors"
import { SessionEvent } from "~/domain/events"
import { IdentityProviderRepository, SessionRepository } from "~/domain/repositories"

export interface CreateSignOutRequestCommand {
  sessionId: string
  nonce: string
  redirectUrl: string
}

export interface CreateSignOutRequestResult {
  url: string
  signOutState?: SignOutState
}

export class CreateSignOutRequestHandler {
  constructor(
    private readonly authClientFactory: AuthClientFactory,
    private readonly eventPublisher: EventPublisher,
    private readonly identityProviderRepository: IdentityProviderRepository,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(command: CreateSignOutRequestCommand): Promise<CreateSignOutRequestResult> {
    try {
      const session = await this.sessionRepository.tryGetById(command.sessionId)
      if (!session || !session.isActive) {
        return { url: command.redirectUrl }
      }

      session.ensureIsIdentityProviderSession()

      const idp = await this.identityProviderRepository.getById(session.identityProviderId!)
      idp.verifyRedirectUrl(command.redirectUrl)

      session.terminateIdentityProviderSessionByUser()
      await this.sessionRepository.update(session)

      this.eventPublisher.publishEvent(SessionEvent.sessionTerminatedByUser(session))

      const client = this.authClientFactory.createClient(idp)
      if (!client.supportsSignOut) {
        return { url: command.redirectUrl }
      }

      return await client.createSignOutRequest(command.redirectUrl, session.idToken!)
    } catch (error: unknown) {
      if (error instanceof AuthenticationError) {
        this.eventPublisher.publishEvent(error.toEvent())
      }

      throw error
    }
  }
}
