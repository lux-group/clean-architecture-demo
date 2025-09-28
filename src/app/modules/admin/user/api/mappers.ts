import { User, UserIdentity } from "~/domain/entities"
import { MapperBuilder } from "~/lib/MapperBuilder"
import { QueryResult } from "~/lib/types"
import { CreateUserCommand } from "../commands/CreateUserHandler"
import { UpdateUserCommand } from "../commands/UpdateUserHandler"
import * as models from "./models"

export const toCreateUserCommand = MapperBuilder.for<models.CreateBody>().toCamelCase().build<CreateUserCommand>()

export const toUpdateUserCommand = MapperBuilder.for<models.UpdateBody>().toCamelCase().build<UpdateUserCommand>()

const toUserIdentityDto = MapperBuilder.for<UserIdentity>().omit("id").toSnakeCase().build()

export const toSingleUserDto = MapperBuilder.for<User>()
  .map(item => item.props)
  .omit("passwordHash")
  .mapProperty("identities", identities => identities?.map(toUserIdentityDto))
  .datesToIsoString()
  .toSnakeCase()
  .build<models.SingleResponse>()

export const toPaginatedUsersDto = MapperBuilder.for<QueryResult<User>>()
  .mapProperty("items", items => items.map(toSingleUserDto))
  .toSnakeCase()
  .build<models.PaginatedResponse>()
