import { Request, Response } from "express"
import { Authorize, Controller, Get, Post } from "~/app/decorators"
import { Session } from "~/domain/entities"
import { TerminateSessionCommand, TerminateSessionHandler } from "../commands/TerminateSessionHandler"
import { GetSessionByIdHandler, GetSessionByIdQuery } from "../queries/GetSessionByIdHandler"
import { SearchSessionsHandler } from "../queries/SearchSessionsHandler"
import { parseQuery } from "~/app/shared/utils/parseQuery"

@Controller("/admin/sessions")
export class SessionController {
  constructor(
    private readonly terminateSessionHandler: TerminateSessionHandler,
    private readonly getSessionByIdHandler: GetSessionByIdHandler,
    private readonly searchSessionsHandler: SearchSessionsHandler,
  ) {}

  @Get("/")
  @Authorize({ scopes: ["session:write", "session:read"] })
  async search(req: Request, res: Response) {
    const query = parseQuery<Session>(req.query, ["createdAt"], ["userId", "identityProviderId"])
    const result = await this.searchSessionsHandler.execute(query)
    res.json({ ...result, items: result.items.map(this.present) })
  }

  @Get("/:id")
  @Authorize({ scopes: ["session:write", "session:read"] })
  async getById(req: Request, res: Response) {
    const query: GetSessionByIdQuery = { id: req.params.id }
    const item = await this.getSessionByIdHandler.execute(query)
    res.json(this.present(item))
  }

  @Post("/:id/terminate")
  @Authorize({ scopes: ["session:write"] })
  async terminate(req: Request, res: Response) {
    const command: TerminateSessionCommand = { sessionId: req.params.id }
    await this.terminateSessionHandler.execute(command)
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
