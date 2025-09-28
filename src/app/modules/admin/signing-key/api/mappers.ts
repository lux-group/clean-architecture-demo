import { SigningKey } from "~/domain/entities"
import { MapperBuilder } from "~/lib/MapperBuilder"
import { QueryResult } from "~/lib/types"
import * as models from "./models"

export const toSingleSigningKeyDto = MapperBuilder.for<SigningKey>()
  .map(item => item.props)
  .omit("privateKey")
  .datesToIsoString()
  .toSnakeCase()
  .build<models.SingleResponse>()

export const toPaginatedSigningKeysDto = MapperBuilder.for<QueryResult<SigningKey>>()
  .mapProperty("items", items => items.map(toSingleSigningKeyDto))
  .toSnakeCase()
  .build<models.PaginatedResponse>()
