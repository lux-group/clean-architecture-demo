import { SigningKey } from "~/domain/entities"
import { SigningKeyRepository } from "~/domain/repositories"

export class GetAllSigningKeysUseCase {
  constructor(
    private readonly signingKeyRepository: SigningKeyRepository,
  ) {}

  async execute(): Promise<SigningKey[]> {
    return await this.signingKeyRepository.query()
  }
}
