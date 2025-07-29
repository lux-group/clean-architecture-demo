import { SigningKeyRepository } from "~/domain/repositories"

export interface DeleteSigningKeyInput {
  id: string
}

export class DeleteSigningKeyUseCase {
  constructor(
    private readonly signingKeyRepository: SigningKeyRepository,
  ) {}

  async execute(input: DeleteSigningKeyInput): Promise<void> {
    const signingKey = await this.signingKeyRepository.getById(input.id)
    signingKey.ensureCanDelete()
    await this.signingKeyRepository.delete(signingKey)
  }
}
