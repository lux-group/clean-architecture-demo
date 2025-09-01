import { Request, Response } from "express"
import { Authorize, Controller, Delete, Get, Post } from "~/app/decorators"
import { SigningKey } from "~/domain/entities"
import { CreateNewSigningKeyHandler } from "../commands/CreateNewSigningKeyHandler"
import { DeleteSigningKeyCommand, DeleteSigningKeyHandler } from "../commands/DeleteSigningKeyHandler"
import { GetSigningKeyByIdHandler, GetSigningKeyByIdQuery } from "../queries/GetSigningKeyByIdHandler"
import { SearchSigningKeysHandler } from "../queries/SearchSigningKeysHandler"
import { parseQuery } from "~/app/shared/utils/parseQuery"

@Controller("/admin/signing-keys")
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
  async search(req: Request, res: Response) {
    const query = parseQuery<SigningKey>(req.query, ["createdAt"])
    const result = await this.searchSigningKeysHandler.execute(query)
    res.json({ ...result, items: result.items.map(this.present) })
  }

  @Get("/:id")
  @Authorize({ scopes: ["signing-key:write", "signing-key:read"] })
  async getById(req: Request, res: Response) {
    const query: GetSigningKeyByIdQuery = { id: req.params.id }
    const item = await this.getSigningKeyByIdHandler.execute(query)
    res.json(this.present(item))
  }

  @Post("/")
  @Authorize({ scopes: ["signing-key:write"] })
  async create(req: Request, res: Response) {
    const item = await this.createNewSigningKeyHandler.execute()
    res.status(201)
      .header("Location", `${this.baseUrl}/admin/signing-keys/${item.id}`)
      .json(this.present(item))
  }

  @Delete("/:id")
  @Authorize({ scopes: ["signing-key:write"] })
  async delete(req: Request, res: Response) {
    const command: DeleteSigningKeyCommand = { id: req.params.id }
    await this.deleteSigningKeyHandler.execute(command)
    res.status(204).send()
  }

  private present(item: SigningKey) {
    return {
      id: item.id,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
      public_key: item.publicKey,
    }
  }
}
