import { IdentityProvider } from "~/domain/entities"
import { IdentityProviderRepository } from "~/domain/repositories"

export interface SearchIdentityProvidersQuery {
  offset: number
  limit: number
}

export class SearchIdentityProvidersHandler {
  constructor(
    private readonly identityProviderRepository: IdentityProviderRepository,
  ) {}

  async execute(query: SearchIdentityProvidersQuery): Promise<IdentityProvider[]> {
    return await this.identityProviderRepository.query(query.offset, query.limit)
  }
}
