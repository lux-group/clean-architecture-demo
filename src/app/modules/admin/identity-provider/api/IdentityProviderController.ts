import { Request, Response } from "express"
import { Authorize, Controller, Delete, Get, HandleDomainErrors, Post, Put, Schema } from "~/app/routing"
import { parseQuery } from "~/app/shared/utils/parseQuery"
import { IdentityProvider } from "~/domain/entities"
import { CreateIdentityProviderCommand, CreateIdentityProviderHandler } from "../commands/CreateIdentityProviderHandler"
import { DeleteIdentityProviderCommand, DeleteIdentityProviderHandler } from "../commands/DeleteIdentityProviderHandler"
import { UpdateIdentityProviderCommand, UpdateIdentityProviderHandler } from "../commands/UpdateIdentityProviderHandler"
import { GetIdentityProviderByIdHandler, GetIdentityProviderByIdQuery } from "../queries/GetIdentityProviderByIdHandler"
import { SearchIdentityProvidersHandler } from "../queries/SearchIdentityProvidersHandler"
import * as map from "./mappers"
import * as models from "./models"
import * as schemas from "./schemas"

@Controller("/admin/v1/identity-providers")
@HandleDomainErrors({ format: "Standard" })
export class IdentityProviderController {
  constructor(
    private readonly baseUrl: string,
    private readonly createIdentityProviderHandler: CreateIdentityProviderHandler,
    private readonly deleteIdentityProviderHandler: DeleteIdentityProviderHandler,
    private readonly updateIdentityProviderHandler: UpdateIdentityProviderHandler,
    private readonly getIdentityProviderByIdHandler: GetIdentityProviderByIdHandler,
    private readonly searchIdentityProvidersHandler: SearchIdentityProvidersHandler,
  ) { }

  @Get("/")
  @Authorize({ scopes: ["identity-provider:write", "identity-provider:read"] })
  @Schema({ responseBody: schemas.paginatedResponse })
  async search(req: Request, res: Response<models.PaginatedResponse>) {
    const query = parseQuery<IdentityProvider>(req.query, ["createdAt", "name"], ["name"])
    const result = await this.searchIdentityProvidersHandler.execute(query)
    res.json(map.toPaginatedIdentityProvidersDto(result))
  }

  @Get("/:id")
  @Authorize({ scopes: ["identity-provider:write", "identity-provider:read"] })
  @Schema({ params: schemas.idParam, responseBody: schemas.singleResponse })
  async getById(req: Request<models.IdParams>, res: Response<models.SingleResponse>) {
    const query: GetIdentityProviderByIdQuery = { id: req.params.id }
    const item = await this.getIdentityProviderByIdHandler.execute(query)
    res.json(map.toSingleIdentityProviderDto(item))
  }

  @Post("/")
  @Authorize({ scopes: ["identity-provider:write"] })
  @Schema({ requestBody: schemas.createBody, responseBody: schemas.singleResponse })
  async create(req: Request<never, never, models.CreateBody>, res: Response<models.SingleResponse>) {
    const command: CreateIdentityProviderCommand = map.toCreateIdentityProviderCommand(req.body)
    const item = await this.createIdentityProviderHandler.execute(command)
    res
      .status(201)
      .header("Location", `${this.baseUrl}/admin/v1/identity-providers/${item.id}`)
      .json(map.toSingleIdentityProviderDto(item))
  }

  @Put("/:id")
  @Authorize({ scopes: ["identity-provider:write"] })
  @Schema({ params: schemas.idParam, requestBody: schemas.updateBody, responseBody: schemas.singleResponse })
  async update(req: Request<models.IdParams, never, models.UpdateBody>, res: Response<models.SingleResponse>) {
    const command: UpdateIdentityProviderCommand = {
      id: req.params.id,
      ...map.toUpdateIdentityProviderCommand(req.body),
    }
    const item = await this.updateIdentityProviderHandler.execute(command)
    res.json(map.toSingleIdentityProviderDto(item))
  }

  @Delete("/:id")
  @Authorize({ scopes: ["identity-provider:write"] })
  @Schema({ params: schemas.idParam })
  async delete(req: Request<models.IdParams>, res: Response) {
    const command: DeleteIdentityProviderCommand = { id: req.params.id }
    await this.deleteIdentityProviderHandler.execute(command)
    res.status(204).send()
  }
}
