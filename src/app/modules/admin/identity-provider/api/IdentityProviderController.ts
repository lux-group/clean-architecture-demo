import { Request, Response } from "express"
import { Authorize, Controller, Delete, Get, HandleDomainErrors, Post, Put } from "~/app/routing"
import { parseQuery } from "~/app/shared/utils/parseQuery"
import { IdentityProvider } from "~/domain/entities"
import { CreateIdentityProviderCommand, CreateIdentityProviderHandler } from "../commands/CreateIdentityProviderHandler"
import { DeleteIdentityProviderCommand, DeleteIdentityProviderHandler } from "../commands/DeleteIdentityProviderHandler"
import { UpdateIdentityProviderCommand, UpdateIdentityProviderHandler } from "../commands/UpdateIdentityProviderHandler"
import { GetIdentityProviderByIdHandler, GetIdentityProviderByIdQuery } from "../queries/GetIdentityProviderByIdHandler"
import { SearchIdentityProvidersHandler } from "../queries/SearchIdentityProvidersHandler"
import * as dto from "./dtos"
import * as map from "./mappers"
//import * as schemas from "./schemas"

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
  ) {}

  @Get("/")
  @Authorize({ scopes: ["identity-provider:write", "identity-provider:read"] })
  //@ValidateResponseBody(schemas.paginatedResponse)
  async search(req: Request, res: Response<dto.PaginatedResponse>) {
    const query = parseQuery<IdentityProvider>(req.query, ["createdAt", "name"], ["name"])
    const result = await this.searchIdentityProvidersHandler.execute(query)
    res.json(map.toPaginatedIdentityProvidersDto(result))
  }

  @Get("/:id")
  @Authorize({ scopes: ["identity-provider:write", "identity-provider:read"] })
  //@ValidateRequestParams(schemas.idParam)
  //@ValidateResponseBody(schemas.singleResponse)
  async getById(req: Request<dto.IdParams>, res: Response<dto.SingleResponse>) {
    const query: GetIdentityProviderByIdQuery = { id: req.params.id }
    const item = await this.getIdentityProviderByIdHandler.execute(query)
    res.json(map.toSingleIdentityProviderDto(item))
  }

  @Post("/")
  @Authorize({ scopes: ["identity-provider:write"] })
  //@ValidateRequestBody(schemas.createBody)
  //@ValidateResponseBody(schemas.singleResponse)
  async create(req: Request<unknown, dto.CreateBody>, res: Response<dto.SingleResponse>) {
    const command: CreateIdentityProviderCommand = map.toCreateIdentityProviderCommand(req.body)
    const item = await this.createIdentityProviderHandler.execute(command)
    res
      .status(201)
      .header("Location", `${this.baseUrl}/admin/v1/identity-providers/${item.id}`)
      .json(map.toSingleIdentityProviderDto(item))
  }

  @Put("/:id")
  @Authorize({ scopes: ["identity-provider:write"] })
  //@ValidateRequestParams(schemas.idParam)
  //@ValidateRequestBody(schemas.updateBody)
  //@ValidateResponseBody(schemas.singleResponse)
  async update(req: Request<dto.IdParams, dto.UpdateBody>, res: Response<dto.SingleResponse>) {
    const command: UpdateIdentityProviderCommand = {
      id: req.params.id,
      ...map.toUpdateIdentityProviderCommand(req.body),
    }
    const item = await this.updateIdentityProviderHandler.execute(command)
    res.json(map.toSingleIdentityProviderDto(item))
  }

  @Delete("/:id")
  @Authorize({ scopes: ["identity-provider:write"] })
  //@ValidateRequestParams(schemas.idParam)
  async delete(req: Request<dto.IdParams>, res: Response) {
    const command: DeleteIdentityProviderCommand = { id: req.params.id }
    await this.deleteIdentityProviderHandler.execute(command)
    res.status(204).send()
  }
}
