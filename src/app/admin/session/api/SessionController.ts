import { Request, Response } from "express"
import { Session } from "~/domain/entities"
import { GetAllSessionsUseCase } from "../use-cases/GetAllSessionsUseCase"
import { GetSessionByIdInput, GetSessionByIdUseCase } from "../use-cases/GetSessionByIdUseCase"
import { TerminateSessionInput, TerminateSessionUseCase } from "../use-cases/TerminateSessionUseCase"

export class SessionController {
  constructor(
    private readonly getAllSessionsUseCase: GetAllSessionsUseCase,
    private readonly getSessionByIdUseCase: GetSessionByIdUseCase,
    private readonly terminateSessionUseCase: TerminateSessionUseCase,
  ) {}

  async getAll(req: Request, res: Response) {
    const items = await this.getAllSessionsUseCase.execute()
    res.json(items.map(this.present))
  }

  async getById(req: Request, res: Response) {
    const input: GetSessionByIdInput = { id: req.params.id }
    const item = await this.getSessionByIdUseCase.execute(input)
    res.json(this.present(item))
  }
  
  async terminate(req: Request, res: Response) {
    const input: TerminateSessionInput = { sessionId: req.params.id }
    await this.terminateSessionUseCase.execute(input)
    res.status(204).send()
  }

  private present(item: Session) {
    return {
      id: item.id,
      created_at: item.createdAt,
      last_refresh_at: item.lastRefreshAt,
      expires_at: item.expiresAt,
      terminated_at: item.terminatedAt,
      status: item.status,
      user_id: item.userId,
      identity_provider_id: item.identityProviderId,
      identity_provider_session_id: item.identityProviderSessionId,
    }
  }
}