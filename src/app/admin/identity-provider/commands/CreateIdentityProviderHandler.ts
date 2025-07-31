import { CreateIdentityProviderProps, IdentityProvider } from "~/domain/entities"
import { IdentityProviderRepository } from "~/domain/repositories"

export type CreateIdentityProviderCommand = CreateIdentityProviderProps

export class CreateIdentityProviderHandler {
  constructor(
    private readonly identityProviderRepository: IdentityProviderRepository,
  ) {}

  async execute(command: CreateIdentityProviderCommand): Promise<IdentityProvider> {
    const identityProvider = IdentityProvider.createNew(command)
    await this.identityProviderRepository.insert(identityProvider)
    return identityProvider
  }
}
