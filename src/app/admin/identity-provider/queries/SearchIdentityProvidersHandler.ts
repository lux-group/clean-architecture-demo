import { IdentityProvider } from "~/domain/entities"
import { IdentityProviderRepository } from "~/domain/repositories"

export interface SearchIdentityProvidersQuery {
  offset: number
  limit: number
}

export interface SearchIdentityProvidersResult {
  offset: number
  limit: number
  items: IdentityProvider[]
}

export class SearchIdentityProvidersHandler {
  constructor(
    private readonly identityProviderRepository: IdentityProviderRepository,
  ) {}

  async execute(query: SearchIdentityProvidersQuery): Promise<SearchIdentityProvidersResult> {
    const items = await this.identityProviderRepository.query(query.offset, query.limit)
    return {
      offset: query.offset,
      limit: query.limit,
      items
    }
  }
}
