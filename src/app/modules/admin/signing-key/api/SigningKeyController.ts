import { Request, Response } from "express"
import { Authorize, Controller, Delete, Get, HandleDomainErrors, Post, Schema } from "~/app/routing"
import { parseQuery } from "~/app/shared/utils/parseQuery"
import { SigningKey } from "~/domain/entities"
import { CreateNewSigningKeyHandler } from "../commands/CreateNewSigningKeyHandler"
import { DeleteSigningKeyCommand, DeleteSigningKeyHandler } from "../commands/DeleteSigningKeyHandler"
import { GetSigningKeyByIdHandler, GetSigningKeyByIdQuery } from "../queries/GetSigningKeyByIdHandler"
import { SearchSigningKeysHandler } from "../queries/SearchSigningKeysHandler"
import * as map from "./mappers"
import * as models from "./models"
import * as schemas from "./schemas"

@Controller("/admin/v1/signing-keys")
@HandleDomainErrors({ format: "Standard" })
export class SigningKeyController {
  constructor(
    private readonly baseUrl: string,
    private readonly createNewSigningKeyHandler: CreateNewSigningKeyHandler,
    private readonly deleteSigningKeyHandler: DeleteSigningKeyHandler,
    private readonly getSigningKeyByIdHandler: GetSigningKeyByIdHandler,
    private readonly searchSigningKeysHandler: SearchSigningKeysHandler,
  ) {}

  @Get("/")
  @Authorize({ scopes: ["signing-key:write", "signing-key:read"] })
  @Schema({ responseBody: schemas.paginatedResponse })
  async search(req: Request, res: Response<models.PaginatedResponse>) {
    const query = parseQuery<SigningKey>(req.query, ["createdAt"])
    const result = await this.searchSigningKeysHandler.execute(query)
    res.json(map.toPaginatedSigningKeysDto(result))
  }

  @Get("/:id")
  @Authorize({ scopes: ["signing-key:write", "signing-key:read"] })
  @Schema({ params: schemas.idParam, responseBody: schemas.singleResponse })
  async getById(req: Request<models.IdParams>, res: Response<models.SingleResponse>) {
    const query: GetSigningKeyByIdQuery = { id: req.params.id }
    const item = await this.getSigningKeyByIdHandler.execute(query)
    res.json(map.toSingleSigningKeyDto(item))
  }

  @Post("/")
  @Authorize({ scopes: ["signing-key:write"] })
  @Schema({ responseBody: schemas.singleResponse })
  async create(_req: Request, res: Response<models.SingleResponse>) {
    const item = await this.createNewSigningKeyHandler.execute()
    res
      .status(201)
      .header("Location", `${this.baseUrl}/admin/v1/signing-keys/${item.id}`)
      .json(map.toSingleSigningKeyDto(item))
  }

  @Delete("/:id")
  @Authorize({ scopes: ["signing-key:write"] })
  @Schema({ params: schemas.idParam })
  async delete(req: Request<models.IdParams>, res: Response) {
    const command: DeleteSigningKeyCommand = { id: req.params.id }
    await this.deleteSigningKeyHandler.execute(command)
    res.status(204).send()
  }
}
