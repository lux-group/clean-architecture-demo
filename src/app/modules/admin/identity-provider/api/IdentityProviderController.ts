import { Request, Response } from "express"
import { Authorize, Controller, Delete, Get, HandleDomainErrors, Post, Put } from "~/app/routing"
import { parseQuery } from "~/app/shared/utils/parseQuery"
import { IdentityProvider, IdentityProviderAuthSettings } from "~/domain/entities"
import { CreateIdentityProviderCommand, CreateIdentityProviderHandler } from "../commands/CreateIdentityProviderHandler"
import { DeleteIdentityProviderCommand, DeleteIdentityProviderHandler } from "../commands/DeleteIdentityProviderHandler"
import { UpdateIdentityProviderCommand, UpdateIdentityProviderHandler } from "../commands/UpdateIdentityProviderHandler"
import { GetIdentityProviderByIdHandler, GetIdentityProviderByIdQuery } from "../queries/GetIdentityProviderByIdHandler"
import { SearchIdentityProvidersHandler } from "../queries/SearchIdentityProvidersHandler"

@Controller("/admin/v1/identity-providers")
@HandleDomainErrors({ format: "Standard" })
export class IdentityProviderController {
  constructor(
    private readonly baseUrl: string,
    private readonly createIdentityProviderHandler: CreateIdentityProviderHandler,
    private readonly deleteIdentityProviderHandler: DeleteIdentityProviderHandler,
    private readonly updateIdentityProviderHandler: UpdateIdentityProviderHandler,
    private readonly getIdentityProviderByIdHandler: GetIdentityProviderByIdHandler,
    private readonly searchIdentityProvidersHandler: SearchIdentityProvidersHandler,
  ) {}

  @Get("/")
  @Authorize({ scopes: ["identity-provider:write", "identity-provider:read"] })
  async search(req: Request, res: Response) {
    const query = parseQuery<IdentityProvider>(req.query, ["createdAt", "name"], ["name"])
    const result = await this.searchIdentityProvidersHandler.execute(query)
    res.json({ ...result, items: result.items.map(this.present) })
  }

  @Get("/:id")
  @Authorize({ scopes: ["identity-provider:write", "identity-provider:read"] })
  async getById(req: Request, res: Response) {
    const query: GetIdentityProviderByIdQuery = { id: req.params.id }
    const item = await this.getIdentityProviderByIdHandler.execute(query)
    res.json(this.present(item))
  }

  @Post("/")
  @Authorize({ scopes: ["identity-provider:write"] })
  async create(req: Request, res: Response) {
    const command: CreateIdentityProviderCommand = this.parseBody(req.body)
    const item = await this.createIdentityProviderHandler.execute(command)
    res
      .status(201)
      .header("Location", `${this.baseUrl}/admin/v1/identity-providers/${item.id}`)
      .json(this.present(item))
  }

  @Put("/:id")
  @Authorize({ scopes: ["identity-provider:write"] })
  async update(req: Request, res: Response) {
    const command: UpdateIdentityProviderCommand = { id: req.params.id, ...this.parseBody(req.body) }
    const item = await this.updateIdentityProviderHandler.execute(command)
    res.json(this.present(item))
  }

  @Delete("/:id")
  @Authorize({ scopes: ["identity-provider:write"] })
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
      authSettings: body.auth_settings
        ? ({
            type: body.auth_settings.type,
            brand: body.auth_settings.brand,
            clientId: body.auth_settings.client_id,
            clientSecret: body.auth_settings.client_secret,
            redirectUrls: body.auth_settings.redirect_urls,
            autoLinkUsers: body.auth_settings.auto_link_users,
            autoCreateUsers: body.auth_settings.auto_create_users,
          } as IdentityProviderAuthSettings)
        : null,
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
      auth_settings: item.authSettings
        ? {
            type: item.authSettings.type,
            brand: item.authSettings.brand,
            client_id: item.authSettings.clientId,
            client_secret: item.authSettings.clientSecret,
            redirect_urls: item.authSettings.redirectUrls,
            auto_link_users: item.authSettings.autoLinkUsers,
            auto_create_users: item.authSettings.autoCreateUsers,
          }
        : null,
    }
  }
}
