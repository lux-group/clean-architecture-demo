import { Request, Response } from "express"
import { User } from "~/domain/entities"
import { CreateUserCommand, CreateUserHandler } from "../commands/CreateUserHandler"
import { DeleteUserCommand, DeleteUserHandler } from "../commands/DeleteUserHandler"
import { UpdateUserCommand, UpdateUserHandler } from "../commands/UpdateUserHandler"
import { GetUserByIdHandler, GetUserByIdQuery } from "../queries/GetUserByIdHandler"
import { SearchUsersHandler, SearchUsersQuery } from "../queries/SearchUsersHandler"

export class UserController {
  constructor(
    private readonly baseUrl: string,
    private readonly createUserHandler: CreateUserHandler,
    private readonly deleteUserHandler: DeleteUserHandler,
    private readonly updateUserHandler: UpdateUserHandler,
    private readonly getUserByIdHandler: GetUserByIdHandler,
    private readonly searchUsersHandler: SearchUsersHandler,
  ) {}

  async getAll(req: Request, res: Response) {
    const query: SearchUsersQuery = {
      offset: Number(req.query.offset) || 0,
      limit: Number(req.query.limit) || 10,
    }

    const result = await this.searchUsersHandler.execute(query)
    res.json({ ...result, items: result.items.map(this.present) })
  }

  async getById(req: Request, res: Response) {
    const query: GetUserByIdQuery = { id: req.params.id }
    const item = await this.getUserByIdHandler.execute(query)
    res.json(this.present(item))
  }

  async create(req: Request, res: Response) {
    const command: CreateUserCommand = this.parseCreateBody(req.body)
    const item = await this.createUserHandler.execute(command)
    res.status(201)
      .header("Location", `${this.baseUrl}/admin/users/${item.id}`)
      .json(this.present(item))
  }

  async update(req: Request, res: Response) {
    const command: UpdateUserCommand = { id: req.params.id, ...this.parseUpdateBody(req.body) }
    const item = await this.updateUserHandler.execute(command)
    res.json(this.present(item))
  }

  async delete(req: Request, res: Response) {
    const command: DeleteUserCommand = { id: req.params.id }
    await this.deleteUserHandler.execute(command)
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