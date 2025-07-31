import { Request, Response } from "express"
import { GetOpenidConfigurationHandler } from "../queries/GetOpenidConfigurationHandler"
import { GetJsonWebKeysHandler } from "../queries/GetJsonWebKeysHandler"

export class MetadataController {
  constructor(
    private readonly getOpenidConfigurationHandler: GetOpenidConfigurationHandler,
    private readonly getJsonWebKeysHandler: GetJsonWebKeysHandler,
  ) {}

  async getOpenidConfiguration(req: Request, res: Response) {
    const document = await this.getOpenidConfigurationHandler.execute()
    res.json(document)
  }

  async getJsonWebKeys(req: Request, res: Response) {
    const document = await this.getJsonWebKeysHandler.execute()
    res.json(document)
  }
}
