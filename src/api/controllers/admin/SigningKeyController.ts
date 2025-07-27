import { Request, Response } from "express"
import { SigningKey } from "~/domain/entities"
import {
  CreateNewSigningKeyUseCase,
  DeleteSigningKeyInput,
  DeleteSigningKeyUseCase,
  GetAllSigningKeysUseCase,
  GetSigningKeyByIdInput,
  GetSigningKeyByIdUseCase
} from "~/application/admin/signing-key"

export class SigningKeyController {
  constructor(
    private readonly baseUrl: string,
    private readonly createNewSigningKeyUseCase: CreateNewSigningKeyUseCase,
    private readonly deleteSigningKeyUseCase: DeleteSigningKeyUseCase,
    private readonly getAllSigningKeysUseCase: GetAllSigningKeysUseCase,
    private readonly getSigningKeyByIdUseCase: GetSigningKeyByIdUseCase,
  ) {}

  async getAll(req: Request, res: Response) {
    const items = await this.getAllSigningKeysUseCase.execute()
    res.json(items.map(this.present))
  }

  async getById(req: Request, res: Response) {
    const input: GetSigningKeyByIdInput = { id: req.params.id }
    const item = await this.getSigningKeyByIdUseCase.execute(input)
    res.json(this.present(item))
  }

  async create(req: Request, res: Response) {
    const item = await this.createNewSigningKeyUseCase.execute()
    res.status(201)
      .header("Location", `${this.baseUrl}/admin/signing-keys/${item.id}`)
      .json(this.present(item))
  }

  async delete(req: Request, res: Response) {
    const input: DeleteSigningKeyInput = { id: req.params.id }
    await this.deleteSigningKeyUseCase.execute(input)
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
