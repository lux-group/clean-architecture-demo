import { SigningKey } from "~/domain/entities"
import { SigningKeyRepository } from "~/domain/repositories"

export interface GetSigningKeyByIdQuery {
  id: string
}

export class GetSigningKeyByIdHandler {
  constructor(
    private readonly signingKeyRepository: SigningKeyRepository,
  ) {}

  async execute(query: GetSigningKeyByIdQuery): Promise<SigningKey> {
    return await this.signingKeyRepository.getById(query.id)
  }
}
