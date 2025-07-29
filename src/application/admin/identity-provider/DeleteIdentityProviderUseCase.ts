import { IdentityProviderRepository } from "~/domain/repositories"

export interface DeleteIdentityProviderInput {
  id: string
}

export class DeleteIdentityProviderUseCase {
  constructor(
    private readonly identityProviderRepository: IdentityProviderRepository,
  ) {}

  async execute(input: DeleteIdentityProviderInput): Promise<void> {
    const identityProvider = await this.identityProviderRepository.getById(input.id)
    await this.identityProviderRepository.delete(identityProvider)
  }
}
