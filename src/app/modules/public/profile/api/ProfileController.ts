import { Request, Response } from "express"
import { Authorize, Controller, Get, HandleDomainErrors } from "~/app/routing"
import { getRequestContext } from "~/app/shared/utils/getRequestContext"
import { User } from "~/domain/entities"
import { GetProfileByIdHandler, GetProfileByIdQuery } from "../queries/GetProfileByIdHandler"

@Controller("/v2/profiles")
@HandleDomainErrors({ format: "Standard" })
export class ProfileController {
  constructor(private readonly getProfileByIdHandler: GetProfileByIdHandler) {}

  @Get("/")
  @Authorize()
  async getProfile(_req: Request, res: Response) {
    const context = getRequestContext()
    const query: GetProfileByIdQuery = { id: context!.user!.id }
    const item = await this.getProfileByIdHandler.execute(query)
    res.json(this.present(item))
  }

  private present(item: User) {
    return {
      id: item.id,
      brand: item.brand,
      given_name: item.givenName,
      surname: item.surname,
      full_name: item.fullName,
      email: item.email,
      email_verified: item.emailVerified,
      phone: item.phone,
      country: item.country,
      city: item.city,
      postcode: item.postcode,
    }
  }
}
