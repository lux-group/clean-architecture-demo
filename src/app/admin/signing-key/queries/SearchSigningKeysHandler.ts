import { SigningKey } from "~/domain/entities"
import { SigningKeyRepository } from "~/domain/repositories"

export interface SearchSigningKeysQuery {
  offset: number
  limit: number
}

export class SearchSigningKeysHandler {
  constructor(
    private readonly signingKeyRepository: SigningKeyRepository,
  ) {}

  async execute(query: SearchSigningKeysQuery): Promise<SigningKey[]> {
    return await this.signingKeyRepository.query(query.offset, query.limit)
  }
}
