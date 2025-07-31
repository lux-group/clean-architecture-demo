import { IdentityProviderRepository } from "~/domain/repositories"

export interface DeleteIdentityProviderCommand {
  id: string
}

export class DeleteIdentityProviderHandler {
  constructor(
    private readonly identityProviderRepository: IdentityProviderRepository,
  ) {}

  async execute(command: DeleteIdentityProviderCommand): Promise<void> {
    const identityProvider = await this.identityProviderRepository.getById(command.id)
    await this.identityProviderRepository.delete(identityProvider)
  }
}
