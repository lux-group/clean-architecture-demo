import { IdentityProvider } from "~/domain/entities"
import { IdentityProviderRepository } from "~/domain/repositories"
import { Query, QueryResult } from "~/lib/types"

export type SearchIdentityProvidersQuery = Query<IdentityProvider>

export type SearchIdentityProvidersResult = QueryResult<IdentityProvider>

export class SearchIdentityProvidersHandler {
  constructor(private readonly identityProviderRepository: IdentityProviderRepository) {}

  async execute(query: SearchIdentityProvidersQuery): Promise<SearchIdentityProvidersResult> {
    return await this.identityProviderRepository.query(query)
  }
}
