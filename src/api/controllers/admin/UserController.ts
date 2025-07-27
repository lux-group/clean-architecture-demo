import { Request, Response } from "express"
import { User } from "~/domain/entities"
import { 
  CreateUserInput,
  CreateUserUseCase,
  DeleteUserInput,
  DeleteUserUseCase,
  GetAllUsersUseCase,
  GetUserByIdInput,
  GetUserByIdUseCase,
  UpdateUserInput,
  UpdateUserUseCase,
} from "~/application/admin/user"

export class UserController {
  constructor(
    private readonly baseUrl: string,
    private readonly getAllUsersUseCase: GetAllUsersUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  async getAll(req: Request, res: Response) {
    const items = await this.getAllUsersUseCase.execute()
    res.json(items.map(this.present))
  }

  async getById(req: Request, res: Response) {
    const input: GetUserByIdInput = { id: req.params.id }
    const item = await this.getUserByIdUseCase.execute(input)
    res.json(this.present(item))
  }

  async create(req: Request, res: Response) {
    const input: CreateUserInput = this.parseCreateBody(req.body)
    const item = await this.createUserUseCase.execute(input)
    res.status(201)
      .header("Location", `${this.baseUrl}/admin/users/${item.id}`)
      .json(this.present(item))
  }

  async update(req: Request, res: Response) {
    const input: UpdateUserInput = { id: req.params.id, ...this.parseUpdateBody(req.body) }
    const item = await this.updateUserUseCase.execute(input)
    res.json(this.present(item))
  }

  async delete(req: Request, res: Response) {
    const input: DeleteUserInput = { id: req.params.id }
    await this.deleteUserUseCase.execute(input)
    res.status(204).send()
  }

  private parseCreateBody(body: Record<string, any>) {
    return {
      isEnabled: body.is_enabled,
      brand: body.brand,
      givenName: body.given_name,
      surname: body.surname,
      email: body.email,
      emailVerified: false,
      phone: body.phone ?? null,
      country: body.country ?? null,
      city: body.city ?? null,
      postcode: body.postcode ?? null,
      password: body.password,
      roles: body.roles ?? [],
    }
  }

  private parseUpdateBody(body: Record<string, any>) {
    return {
      isEnabled: body.is_enabled,
      givenName: body.given_name,
      surname: body.surname,
      country: body.country ?? null,
      city: body.city ?? null,
      postcode: body.postcode ?? null,
      roles: body.roles ?? [],
    }
  }

  private present(item: User) {
    return {
      id: item.id,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
      is_enabled: item.isEnabled,
      brand: item.brand,
      given_name: item.givenName,
      surname: item.surname,
      full_name: item.fullName,
      email: item.email,
      email_verified: item.emailVerified,
      phone: item.phone,
      country: item.country,
      city: item.city,
      postcode: item.postcode,
      roles: item.roles,
      identities: item.identities.map(identity => ({
        identity_provider_id: identity.identityProviderId,
        identifier_claim_value: identity.identifierClaimValue,
      }))
    }
  }
}