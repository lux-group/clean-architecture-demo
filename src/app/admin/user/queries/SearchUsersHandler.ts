import { Query, QueryResult } from "~/lib/types"
import { User } from "~/domain/entities"
import { UserRepository } from "~/domain/repositories"

export type SearchUsersQuery = Query<User>

export type SearchUsersResult = QueryResult<User>

export class SearchUsersHandler {
  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  async execute(query: SearchUsersQuery): Promise<SearchUsersResult> {
    return await this.userRepository.query(query)
  }
}
