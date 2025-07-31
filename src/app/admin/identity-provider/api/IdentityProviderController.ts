import { Request, Response } from "express"
import { IdentityProvider, IdentityProviderAuthSettings } from "~/domain/entities"
import { CreateIdentityProviderCommand, CreateIdentityProviderHandler } from "../commands/CreateIdentityProviderHandler"
import { DeleteIdentityProviderCommand, DeleteIdentityProviderHandler } from "../commands/DeleteIdentityProviderHandler"
import { UpdateIdentityProviderCommand, UpdateIdentityProviderHandler } from "../commands/UpdateIdentityProviderHandler"
import { GetIdentityProviderByIdHandler, GetIdentityProviderByIdQuery } from "../queries/GetIdentityProviderByIdHandler"
import { SearchIdentityProvidersHandler, SearchIdentityProvidersQuery } from "../queries/SearchIdentityProvidersHandler"

export class IdentityProviderController {
  constructor(
    private readonly baseUrl: string,
    private readonly createIdentityProviderHandler: CreateIdentityProviderHandler,
    private readonly deleteIdentityProviderHandler: DeleteIdentityProviderHandler,
    private readonly updateIdentityProviderHandler: UpdateIdentityProviderHandler,
    private readonly getIdentityProviderByIdHandler: GetIdentityProviderByIdHandler,
    private readonly searchIdentityProvidersHandler: SearchIdentityProvidersHandler,
  ) {}

  async getAll(req: Request, res: Response) {
    const query: SearchIdentityProvidersQuery = {
      offset: Number(req.query.offset) || 0,
      limit: Number(req.query.limit) || 10,
    }
    
    const items = await this.searchIdentityProvidersHandler.execute(query)
    res.json(items.map(this.present))
  }

  async getById(req: Request, res: Response) {
    const query: GetIdentityProviderByIdQuery = { id: req.params.id }
    const item = await this.getIdentityProviderByIdHandler.execute(query)
    res.json(this.present(item))
  }

  async create(req: Request, res: Response) {
    const command: CreateIdentityProviderCommand = this.parseBody(req.body)
    const item = await this.createIdentityProviderHandler.execute(command)
    res.status(201)
      .header("Location", `${this.baseUrl}/admin/identity-providers/${item.id}`)
      .json(this.present(item))
  }

  async update(req: Request, res: Response) {
    const command: UpdateIdentityProviderCommand = { id: req.params.id, ...this.parseBody(req.body) }
    const item = await this.updateIdentityProviderHandler.execute(command)
    res.json(this.present(item))
  }

  async delete(req: Request, res: Response) {
    const command: DeleteIdentityProviderCommand = { id: req.params.id }
    await this.deleteIdentityProviderHandler.execute(command)
    res.status(204).send()
  }

  private parseBody(body: Record<string, any>) {
    return {
      name: body.name,
      issuerUrl: body.issuer_url,
      audience: body.audience,
      identifierClaimName: body.identifier_claim_name,
      authSettings: {
        type: body.type,
        brand: body.brand,
        clientId: body.clientId,
        clientSecret: body.clientSecret,
        redirectUrls: body.redirectUrls,
        autoLinkUsers: body.autoLinkUsers,
        autoCreateUsers: body.autoCreateUsers,
      } as IdentityProviderAuthSettings
    }
  }

  private present(item: IdentityProvider) {
    return {
      id: item.id,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
      name: item.name,
      issuer_url: item.issuerUrl,
      audience: item.audience,
      identifier_claim_name: item.identifierClaimName,
      auth_settings: item.authSettings ? {
        type: item.authSettings.type,
        brand: item.authSettings.brand,
        client_id: item.authSettings.clientId,
        client_secret: item.authSettings.clientSecret,
        redirect_urls: item.authSettings.redirectUrls,
        auto_link_users: item.authSettings.autoLinkUsers,
        auto_create_users: item.authSettings.autoCreateUsers,
      } : null
    }
  }
}