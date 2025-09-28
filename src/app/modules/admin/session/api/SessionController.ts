import { Request, Response } from "express"
import { Authorize, Controller, Get, HandleDomainErrors, Post, Schema } from "~/app/routing"
import { parseQuery } from "~/app/shared/utils/parseQuery"
import { Session } from "~/domain/entities"
import { TerminateSessionCommand, TerminateSessionHandler } from "../commands/TerminateSessionHandler"
import { GetSessionByIdHandler, GetSessionByIdQuery } from "../queries/GetSessionByIdHandler"
import { SearchSessionsHandler } from "../queries/SearchSessionsHandler"
import * as map from "./mappers"
import * as models from "./models"
import * as schemas from "./schemas"

@Controller("/admin/v1/sessions")
@HandleDomainErrors({ format: "Standard" })
export class SessionController {
  constructor(
    private readonly terminateSessionHandler: TerminateSessionHandler,
    private readonly getSessionByIdHandler: GetSessionByIdHandler,
    private readonly searchSessionsHandler: SearchSessionsHandler,
  ) {}

  @Get("/")
  @Authorize({ scopes: ["session:write", "session:read"] })
  @Schema({ responseBody: schemas.paginatedResponse })
  async search(req: Request, res: Response<models.PaginatedResponse>) {
    const query = parseQuery<Session>(req.query, ["createdAt"], ["userId", "identityProviderId"])
    const result = await this.searchSessionsHandler.execute(query)
    res.json(map.toPaginatedSessionsDto(result))
  }

  @Get("/:id")
  @Authorize({ scopes: ["session:write", "session:read"] })
  @Schema({ params: schemas.idParam, responseBody: schemas.singleResponse })
  async getById(req: Request<models.IdParams>, res: Response<models.SingleResponse>) {
    const query: GetSessionByIdQuery = { id: req.params.id }
    const item = await this.getSessionByIdHandler.execute(query)
    res.json(map.toSingleSessionDto(item))
  }

  @Post("/:id/terminate")
  @Authorize({ scopes: ["session:write"] })
  @Schema({ params: schemas.idParam })
  async terminate(req: Request<models.IdParams>, res: Response) {
    const command: TerminateSessionCommand = { sessionId: req.params.id }
    await this.terminateSessionHandler.execute(command)
    res.status(204).send()
  }
}
