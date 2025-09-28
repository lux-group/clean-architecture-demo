import { Request, Response } from "express"
import { Authorize, Controller, Get, HandleDomainErrors, Schema } from "~/app/routing"
import { getRequestContext } from "~/app/shared/utils/getRequestContext"
import { GetProfileByIdHandler, GetProfileByIdQuery } from "../queries/GetProfileByIdHandler"
import * as map from "./mappers"
import * as models from "./models"
import * as schemas from "./schemas"

@Controller("/v2/profiles")
@HandleDomainErrors({ format: "Standard" })
export class ProfileController {
  constructor(private readonly getProfileByIdHandler: GetProfileByIdHandler) {}

  @Get("/")
  @Authorize()
  @Schema({ responseBody: schemas.singleResponse })
  async getProfile(_req: Request, res: Response<models.SingleResponse>) {
    const context = getRequestContext()
    const query: GetProfileByIdQuery = { id: context!.user!.id }
    const item = await this.getProfileByIdHandler.execute(query)
    res.json(map.toSingleProfileDto(item))
  }
}
