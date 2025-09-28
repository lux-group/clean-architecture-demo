import { IdentityProvider } from "~/domain/entities"
import { MapperBuilder } from "~/lib/MapperBuilder"
import { QueryResult } from "~/lib/types"
import { CreateIdentityProviderCommand } from "../commands/CreateIdentityProviderHandler"
import { UpdateIdentityProviderCommand } from "../commands/UpdateIdentityProviderHandler"
import * as models from "./models"

export const toCreateIdentityProviderCommand = MapperBuilder.for<models.CreateBody>()
  .toCamelCase()
  .build<CreateIdentityProviderCommand>()

export const toUpdateIdentityProviderCommand = MapperBuilder.for<models.UpdateBody>()
  .toCamelCase()
  .build<UpdateIdentityProviderCommand>()

export const toSingleIdentityProviderDto = MapperBuilder.for<IdentityProvider>()
  .map(item => item.props)
  .datesToIsoString()
  .toSnakeCase()
  .build<models.SingleResponse>()

export const toPaginatedIdentityProvidersDto = MapperBuilder.for<QueryResult<IdentityProvider>>()
  .mapProperty("items", items => items.map(toSingleIdentityProviderDto))
  .toSnakeCase()
  .build<models.PaginatedResponse>()
