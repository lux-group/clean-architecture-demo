import { IdentityProvider } from "~/domain/entities"
import { IdentityProviderRepository } from "~/domain/repositories"

export class GetAllIdentityProvidersUseCase {
  constructor(
    private readonly identityProviderRepository: IdentityProviderRepository,
  ) {}

  async execute(): Promise<IdentityProvider[]> {
    return await this.identityProviderRepository.query()
  }
}
