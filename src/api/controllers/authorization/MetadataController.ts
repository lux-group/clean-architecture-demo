import { Request, Response } from "express"
import { GetJwksUseCase, GetOpenidConfigurationUseCase } from "~/application/authorization/metadata"

export class MetadataController {
  constructor(
    private readonly getOpenidConfigurationUseCase: GetOpenidConfigurationUseCase,
    private readonly getJwksUseCase: GetJwksUseCase,
  ) {}

  async getOpenidConfiguration(req: Request, res: Response) {
    const document = await this.getOpenidConfigurationUseCase.execute()
    res.json(document)
  }

  async getJwks(req: Request, res: Response) {
    const document = await this.getJwksUseCase.execute()
    res.json(document)
  }
}
