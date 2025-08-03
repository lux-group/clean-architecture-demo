import { Request, Response } from "express"
import { SigningKey } from "~/domain/entities"
import { CreateNewSigningKeyHandler } from "../commands/CreateNewSigningKeyHandler"
import { DeleteSigningKeyCommand, DeleteSigningKeyHandler } from "../commands/DeleteSigningKeyHandler"
import { GetSigningKeyByIdHandler, GetSigningKeyByIdQuery } from "../queries/GetSigningKeyByIdHandler"
import { SearchSigningKeysHandler, SearchSigningKeysQuery } from "../queries/SearchSigningKeysHandler"

export class SigningKeyController {
  constructor(
    private readonly baseUrl: string,
    private readonly createNewSigningKeyHandler: CreateNewSigningKeyHandler,
    private readonly deleteSigningKeyHandler: DeleteSigningKeyHandler,
    private readonly getSigningKeyByIdHandler: GetSigningKeyByIdHandler,
    private readonly searchSigningKeysHandler: SearchSigningKeysHandler,
  ) {}

  async getAll(req: Request, res: Response) {
    const query: SearchSigningKeysQuery = {
      offset: Number(req.query.offset) || 0,
      limit: Number(req.query.limit) || 10,
    }

    const result = await this.searchSigningKeysHandler.execute(query)
    res.json({ ...result, items: result.items.map(this.present) })
  }

  async getById(req: Request, res: Response) {
    const query: GetSigningKeyByIdQuery = { id: req.params.id }
    const item = await this.getSigningKeyByIdHandler.execute(query)
    res.json(this.present(item))
  }

  async create(req: Request, res: Response) {
    const item = await this.createNewSigningKeyHandler.execute()
    res.status(201)
      .header("Location", `${this.baseUrl}/admin/signing-keys/${item.id}`)
      .json(this.present(item))
  }

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
