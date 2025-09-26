import { User } from "~/domain/entities"
import { MapperBuilder } from "~/lib/MapperBuilder"
import * as models from "./models"

export const toSingleProfileDto = MapperBuilder.for<User>()
  .map(item => item.props)
  .omit("passwordHash", "roles", "identities")
  .mapProperty("createdAt", createdAt => createdAt?.toISOString())
  .mapProperty("updatedAt", updatedAt => updatedAt?.toISOString())
  .toSnakeCase()
  .create<models.SingleResponse>()
