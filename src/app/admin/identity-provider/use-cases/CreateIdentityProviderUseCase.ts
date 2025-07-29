import { CreateIdentityProviderProps, IdentityProvider } from "~/domain/entities"
import { IdentityProviderRepository } from "~/domain/repositories"

export type CreateIdentityProviderInput = CreateIdentityProviderProps

export class CreateIdentityProviderUseCase {
  constructor(
    private readonly identityProviderRepository: IdentityProviderRepository,
  ) {}

  async execute(input: CreateIdentityProviderInput): Promise<IdentityProvider> {
    const identityProvider = IdentityProvider.createNew(input)
    await this.identityProviderRepository.insert(identityProvider)
    return identityProvider
  }
}
