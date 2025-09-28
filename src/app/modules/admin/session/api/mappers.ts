import { Session } from "~/domain/entities"
import { MapperBuilder } from "~/lib/MapperBuilder"
import { QueryResult } from "~/lib/types"
import * as models from "./models"

export const toSingleSessionDto = MapperBuilder.for<Session>()
  .map(item => item.props)
  .omit("nonce", "idToken", "refreshToken")
  .datesToIsoString()
  .toSnakeCase()
  .build<models.SingleResponse>()

export const toPaginatedSessionsDto = MapperBuilder.for<QueryResult<Session>>()
  .mapProperty("items", items => items.map(toSingleSessionDto))
  .toSnakeCase()
  .build<models.PaginatedResponse>()
