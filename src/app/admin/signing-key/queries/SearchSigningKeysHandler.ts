import { SigningKey } from "~/domain/entities"
import { SigningKeyRepository } from "~/domain/repositories"

export interface SearchSigningKeysQuery {
  offset: number
  limit: number
}

export interface SearchSigningKeysResult {
  offset: number
  limit: number
  items: SigningKey[]
}

export class SearchSigningKeysHandler {
  constructor(
    private readonly signingKeyRepository: SigningKeyRepository,
  ) {}

  async execute(query: SearchSigningKeysQuery): Promise<SearchSigningKeysResult> {
    const items = await this.signingKeyRepository.query(query.offset, query.limit)
    return {
      offset: query.offset,
      limit: query.limit,
      items
    }
  }
}
