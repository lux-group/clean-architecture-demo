import { SigningKey } from "~/domain/entities"
import { SigningKeyRepository } from "~/domain/repositories"

export interface GetSigningKeyByIdInput {
  id: string
}

export class GetSigningKeyByIdUseCase {
  constructor(
    private readonly signingKeyRepository: SigningKeyRepository,
  ) {}

  async execute(input: GetSigningKeyByIdInput): Promise<SigningKey> {
    return await this.signingKeyRepository.getById(input.id)
  }
}
