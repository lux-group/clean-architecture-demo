import { User } from "~/domain/entities"
import { UserRepository } from "~/domain/repositories"

export interface SearchUsersQuery {
  offset: number
  limit: number
}

export interface SearchUsersResult {
  offset: number
  limit: number
  items: User[]
}

export class SearchUsersHandler {
  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  async execute(query: SearchUsersQuery): Promise<SearchUsersResult> {
    const items = await this.userRepository.query(query.offset, query.limit)
    return {
      offset: query.offset,
      limit: query.limit,
      items
    }
  }
}
