import { IdentityProvider, UpdateIdentityProviderProps } from "~/domain/entities"
import { IdentityProviderRepository } from "~/domain/repositories"

export type UpdateIdentityProviderInput = UpdateIdentityProviderProps & {
  id: string
}

export class UpdateIdentityProviderUseCase {
  constructor(
    private readonly identityProviderRepository: IdentityProviderRepository,
  ) {}

  async execute(input: UpdateIdentityProviderInput): Promise<IdentityProvider> {
    const { id, ...props } = input
    const identityProvider = await this.identityProviderRepository.getById(id)
    identityProvider.update(props)
    await this.identityProviderRepository.update(identityProvider)
    return identityProvider
  }
}
