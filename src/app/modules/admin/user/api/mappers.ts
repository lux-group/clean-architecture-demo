import { User } from "~/domain/entities"
import { MapperBuilder } from "~/lib/MapperBuilder"
import { QueryResult } from "~/lib/types"
import { CreateUserCommand } from "../commands/CreateUserHandler"
import { UpdateUserCommand } from "../commands/UpdateUserHandler"
import * as models from "./models"

export const toCreateUserCommand = MapperBuilder.for<models.CreateBody>().toCamelCase().create<CreateUserCommand>()

export const toUpdateUserCommand = MapperBuilder.for<models.UpdateBody>().toCamelCase().create<UpdateUserCommand>()

export const toSingleUserDto = MapperBuilder.for<User>()
  .map(item => item.props)
  .omit("passwordHash")
  .mapProperty("createdAt", createdAt => createdAt?.toISOString())
  .mapProperty("updatedAt", updatedAt => updatedAt?.toISOString())
  .mapProperty("identities", identities =>
    identities?.map(i => ({
      identityProviderId: i.identityProviderId,
      identifier_claim_value: i.identifierClaimValue,
    })),
  )
  .toSnakeCase()
  .create<models.SingleResponse>()

export const toPaginatedUsersDto = MapperBuilder.for<QueryResult<User>>()
  .mapProperty("items", items => items.map(toSingleUserDto))
  .toSnakeCase()
  .create<models.PaginatedResponse>()
