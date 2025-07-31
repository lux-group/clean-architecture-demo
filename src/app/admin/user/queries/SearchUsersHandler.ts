import { User } from "~/domain/entities"
import { UserRepository } from "~/domain/repositories"

export interface SearchUsersQuery {
  offset: number
  limit: number
}

export class SearchUsersHandler {
  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  async execute(query: SearchUsersQuery): Promise<User[]> {
    return await this.userRepository.query(query.offset, query.limit)
  }
}
