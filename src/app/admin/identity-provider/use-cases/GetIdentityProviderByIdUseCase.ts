import { IdentityProvider } from "~/domain/entities"
import { IdentityProviderRepository } from "~/domain/repositories"

export interface GetIdentityProviderByIdInput {
  id: string
}

export class GetIdentityProviderByIdUseCase {
  constructor(
    private readonly identityProviderRepository: IdentityProviderRepository,
  ) {}

  async execute(input: GetIdentityProviderByIdInput): Promise<IdentityProvider> {
    return await this.identityProviderRepository.getById(input.id)
  }
}
