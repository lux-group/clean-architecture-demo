import { IdentityProvider } from "~/domain/entities"
import { IdentityProviderRepository } from "~/domain/repositories"

export interface GetIdentityProviderByIdQuery {
  id: string
}

export class GetIdentityProviderByIdHandler {
  constructor(
    private readonly identityProviderRepository: IdentityProviderRepository,
  ) {}

  async execute(query: GetIdentityProviderByIdQuery): Promise<IdentityProvider> {
    return await this.identityProviderRepository.getById(query.id)
  }
}
