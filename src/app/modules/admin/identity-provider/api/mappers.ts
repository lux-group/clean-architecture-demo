import { IdentityProvider } from "~/domain/entities"
import { MapperBuilder } from "~/lib/MapperBuilder"
import { QueryResult } from "~/lib/types"
import { CreateIdentityProviderCommand } from "../commands/CreateIdentityProviderHandler"
import { UpdateIdentityProviderCommand } from "../commands/UpdateIdentityProviderHandler"
import * as models from "./models"

export const toCreateIdentityProviderCommand = MapperBuilder.for<models.CreateBody>()
  .toCamelCase()
  .create<CreateIdentityProviderCommand>()

export const toUpdateIdentityProviderCommand = MapperBuilder.for<models.UpdateBody>()
  .toCamelCase()
  .create<UpdateIdentityProviderCommand>()

export const toSingleIdentityProviderDto = MapperBuilder.for<IdentityProvider>()
  .map(item => item.props)
  .mapProperty("createdAt", createdAt => createdAt?.toISOString())
  .mapProperty("updatedAt", updatedAt => updatedAt?.toISOString())
  .toSnakeCase()
  .create<models.SingleResponse>()

export const toPaginatedIdentityProvidersDto = MapperBuilder.for<QueryResult<IdentityProvider>>()
  .mapProperty("items", items => items.map(toSingleIdentityProviderDto))
  .toSnakeCase()
  .create<models.PaginatedResponse>()
