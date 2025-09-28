import { Request, Response } from "express"
import { Controller, Get } from "~/app/routing"
import { GetJsonWebKeysHandler } from "../queries/GetJsonWebKeysHandler"
import { GetOpenidConfigurationHandler } from "../queries/GetOpenidConfigurationHandler"

@Controller("/oauth2/.well-known")
export class WellKnownController {
  constructor(
    private readonly getOpenidConfigurationHandler: GetOpenidConfigurationHandler,
    private readonly getJsonWebKeysHandler: GetJsonWebKeysHandler,
  ) {}

  @Get("/openid-configuration")
  async getOpenidConfiguration(_req: Request, res: Response) {
    const document = await this.getOpenidConfigurationHandler.execute()
    res.json(document)
  }

  @Get("/jwks")
  async getJsonWebKeys(_req: Request, res: Response) {
    const document = await this.getJsonWebKeysHandler.execute()
    res.json(document)
  }
}
