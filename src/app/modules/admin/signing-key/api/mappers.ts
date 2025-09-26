import { SigningKey } from "~/domain/entities"
import { MapperBuilder } from "~/lib/MapperBuilder"
import { QueryResult } from "~/lib/types"
import * as models from "./models"

export const toSingleSigningKeyDto = MapperBuilder.for<SigningKey>()
  .map(item => item.props)
  .omit("privateKey")
  .mapProperty("createdAt", createdAt => createdAt?.toISOString())
  .mapProperty("updatedAt", updatedAt => updatedAt?.toISOString())
  .toSnakeCase()
  .create<models.SingleResponse>()

export const toPaginatedSigningKeysDto = MapperBuilder.for<QueryResult<SigningKey>>()
  .mapProperty("items", items => items.map(toSingleSigningKeyDto))
  .toSnakeCase()
  .create<models.PaginatedResponse>()
