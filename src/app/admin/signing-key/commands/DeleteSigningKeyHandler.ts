import { SigningKeyRepository } from "~/domain/repositories"

export interface DeleteSigningKeyCommand {
  id: string
}

export class DeleteSigningKeyHandler {
  constructor(
    private readonly signingKeyRepository: SigningKeyRepository,
  ) {}

  async execute(command: DeleteSigningKeyCommand): Promise<void> {
    const signingKey = await this.signingKeyRepository.getById(command.id)
    signingKey.ensureCanDelete()
    await this.signingKeyRepository.delete(signingKey)
  }
}
