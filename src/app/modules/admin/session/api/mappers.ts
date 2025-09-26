import { Session } from "~/domain/entities"
import { MapperBuilder } from "~/lib/MapperBuilder"
import { QueryResult } from "~/lib/types"
import * as models from "./models"

export const toSingleSessionDto = MapperBuilder.for<Session>()
  .map(item => item.props)
  .omit("nonce", "idToken", "refreshToken")
  .mapProperty("createdAt", createdAt => createdAt?.toISOString())
  .mapProperty("updatedAt", updatedAt => updatedAt?.toISOString())
  .mapProperty("expiresAt", expiresAt => expiresAt?.toISOString())
  .mapProperty("lastRefreshAt", lastRefreshAt => lastRefreshAt?.toISOString())
  .mapProperty("terminatedAt", terminatedAt => terminatedAt?.toISOString() ?? null)
  .toSnakeCase()
  .create<models.SingleResponse>()

export const toPaginatedSessionsDto = MapperBuilder.for<QueryResult<Session>>()
  .mapProperty("items", items => items.map(toSingleSessionDto))
  .toSnakeCase()
  .create<models.PaginatedResponse>()
