import { Request, Response } from "express"
import { Authorize, Controller, Delete, Get, HandleDomainErrors, Post, Put, Schema } from "~/app/routing"
import { parseQuery } from "~/app/shared/utils/parseQuery"
import { User } from "~/domain/entities"
import { CreateUserCommand, CreateUserHandler } from "../commands/CreateUserHandler"
import { DeleteUserCommand, DeleteUserHandler } from "../commands/DeleteUserHandler"
import { UpdateUserCommand, UpdateUserHandler } from "../commands/UpdateUserHandler"
import { GetUserByIdHandler, GetUserByIdQuery } from "../queries/GetUserByIdHandler"
import { SearchUsersHandler } from "../queries/SearchUsersHandler"
import * as map from "./mappers"
import * as models from "./models"
import * as schemas from "./schemas"

@Controller("/admin/v1/users")
@HandleDomainErrors({ format: "Standard" })
export class UserController {
  constructor(
    private readonly baseUrl: string,
    private readonly createUserHandler: CreateUserHandler,
    private readonly deleteUserHandler: DeleteUserHandler,
    private readonly updateUserHandler: UpdateUserHandler,
    private readonly getUserByIdHandler: GetUserByIdHandler,
    private readonly searchUsersHandler: SearchUsersHandler,
  ) {}

  @Get("/")
  @Authorize({ scopes: ["user:write", "user:read"] })
  @Schema({ responseBody: schemas.paginatedResponse })
  async search(req: Request, res: Response<models.PaginatedResponse>) {
    const query = parseQuery<User>(
      req.query,
      ["createdAt", "email", "givenName", "surname"],
      ["email", "givenName", "surname"],
    )
    const result = await this.searchUsersHandler.execute(query)
    res.json(map.toPaginatedUsersDto(result))
  }

  @Get("/:id")
  @Authorize({ scopes: ["user:write", "user:read"] })
  @Schema({ params: schemas.idParam, responseBody: schemas.singleResponse })
  async getById(req: Request<models.IdParams>, res: Response<models.SingleResponse>) {
    const query: GetUserByIdQuery = { id: req.params.id }
    const item = await this.getUserByIdHandler.execute(query)
    res.json(map.toSingleUserDto(item))
  }

  @Post("/")
  @Authorize({ scopes: ["user:write"] })
  @Schema({ requestBody: schemas.createBody, responseBody: schemas.singleResponse })
  async create(req: Request<unknown, models.CreateBody>, res: Response<models.SingleResponse>) {
    const command: CreateUserCommand = map.toCreateUserCommand(req.body)
    const item = await this.createUserHandler.execute(command)
    res.status(201).header("Location", `${this.baseUrl}/admin/v1/users/${item.id}`).json(map.toSingleUserDto(item))
  }

  @Put("/:id")
  @Authorize({ scopes: ["user:write"] })
  @Schema({ params: schemas.idParam, requestBody: schemas.updateBody, responseBody: schemas.singleResponse })
  async update(req: Request<models.IdParams, models.UpdateBody>, res: Response<models.SingleResponse>) {
    const command: UpdateUserCommand = { id: req.params.id, ...map.toUpdateUserCommand(req.body) }
    const item = await this.updateUserHandler.execute(command)
    res.json(map.toSingleUserDto(item))
  }

  @Delete("/:id")
  @Authorize({ scopes: ["user:write"] })
  @Schema({ params: schemas.idParam })
  async delete(req: Request<models.IdParams>, res: Response) {
    const command: DeleteUserCommand = { id: req.params.id }
    await this.deleteUserHandler.execute(command)
    res.status(204).send()
  }
}
