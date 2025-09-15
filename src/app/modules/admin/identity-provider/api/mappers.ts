import { IdentityProvider } from "~/domain/entities"
import { MapperBuilder } from "~/lib/mapping/MapperBuilder"
import { QueryResult } from "~/lib/types"
import { CreateIdentityProviderCommand } from "../commands/CreateIdentityProviderHandler"
import { UpdateIdentityProviderCommand } from "../commands/UpdateIdentityProviderHandler"
import * as dto from "./dtos"

export const toCreateIdentityProviderCommand = MapperBuilder.for<dto.CreateBody>()
  .toCamelCase()
  .create<CreateIdentityProviderCommand>()

export const toUpdateIdentityProviderCommand = MapperBuilder.for<dto.UpdateBody>()
  .toCamelCase()
  .create<UpdateIdentityProviderCommand>()

export const toSingleIdentityProviderDto = MapperBuilder.for<IdentityProvider>()
  .map(item => item.props)
  .mapProperty("createdAt", createdAt => createdAt.toISOString())
  .mapProperty("updatedAt", updatedAt => updatedAt.toISOString())
  .toSnakeCase()
  .create<dto.SingleResponse>()

export const toPaginatedIdentityProvidersDto = MapperBuilder.for<QueryResult<IdentityProvider>>()
  .mapProperty("items", items => items.map(item => item.props))
  .toSnakeCase()
  .create<dto.PaginatedResponse>()
