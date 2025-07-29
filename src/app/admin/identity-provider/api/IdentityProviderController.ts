import { Request, Response } from "express"
import { IdentityProvider, IdentityProviderAuthSettings } from "~/domain/entities"
import { GetAllIdentityProvidersUseCase } from "../use-cases/GetAllIdentityProvidersUseCase"
import { GetIdentityProviderByIdInput, GetIdentityProviderByIdUseCase } from "../use-cases/GetIdentityProviderByIdUseCase"
import { CreateIdentityProviderInput, CreateIdentityProviderUseCase } from "../use-cases/CreateIdentityProviderUseCase"
import { UpdateIdentityProviderInput, UpdateIdentityProviderUseCase } from "../use-cases/UpdateIdentityProviderUseCase"
import { DeleteIdentityProviderInput, DeleteIdentityProviderUseCase } from "../use-cases/DeleteIdentityProviderUseCase"

export class IdentityProviderController {
  constructor(
    private readonly baseUrl: string,
    private readonly getAllIdentityProvidersUseCase: GetAllIdentityProvidersUseCase,
    private readonly getIdentityProviderByIdUseCase: GetIdentityProviderByIdUseCase,
    private readonly createIdentityProviderUseCase: CreateIdentityProviderUseCase,
    private readonly updateIdentityProviderUseCase: UpdateIdentityProviderUseCase,
    private readonly deleteIdentityProviderUseCase: DeleteIdentityProviderUseCase,
  ) {}

  async getAll(req: Request, res: Response) {
    const items = await this.getAllIdentityProvidersUseCase.execute()
    res.json(items.map(this.present))
  }

  async getById(req: Request, res: Response) {
    const input: GetIdentityProviderByIdInput = { id: req.params.id }
    const item = await this.getIdentityProviderByIdUseCase.execute(input)
    res.json(this.present(item))
  }

  async create(req: Request, res: Response) {
    const input: CreateIdentityProviderInput = this.parseBody(req.body)
    const item = await this.createIdentityProviderUseCase.execute(input)
    res.status(201)
      .header("Location", `${this.baseUrl}/admin/identity-providers/${item.id}`)
      .json(this.present(item))
  }

  async update(req: Request, res: Response) {
    const input: UpdateIdentityProviderInput = { id: req.params.id, ...this.parseBody(req.body) }
    const item = await this.updateIdentityProviderUseCase.execute(input)
    res.json(this.present(item))
  }

  async delete(req: Request, res: Response) {
    const input: DeleteIdentityProviderInput = { id: req.params.id }
    await this.deleteIdentityProviderUseCase.execute(input)
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