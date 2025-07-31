import { IdentityProvider, UpdateIdentityProviderProps } from "~/domain/entities"
import { IdentityProviderRepository } from "~/domain/repositories"

export type UpdateIdentityProviderCommand = UpdateIdentityProviderProps & {
  id: string
}

export class UpdateIdentityProviderHandler {
  constructor(
    private readonly identityProviderRepository: IdentityProviderRepository,
  ) {}

  async execute(command: UpdateIdentityProviderCommand): Promise<IdentityProvider> {
    const { id, ...props } = command
    const identityProvider = await this.identityProviderRepository.getById(id)
    identityProvider.update(props)
    await this.identityProviderRepository.update(identityProvider)
    return identityProvider
  }
}
