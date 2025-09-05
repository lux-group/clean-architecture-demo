import { Query, QueryResult } from "~/lib/types"
import { SigningKey } from "~/domain/entities"
import { SigningKeyRepository } from "~/domain/repositories"

export type SearchSigningKeysQuery = Query<SigningKey>

export type SearchSigningKeysResult = QueryResult<SigningKey>

export class SearchSigningKeysHandler {
  constructor(private readonly signingKeyRepository: SigningKeyRepository) {}

  async execute(query: SearchSigningKeysQuery): Promise<SearchSigningKeysResult> {
    return await this.signingKeyRepository.query(query)
  }
}
