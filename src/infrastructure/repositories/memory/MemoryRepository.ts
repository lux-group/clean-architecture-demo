import { NotFoundError } from "~/domain/errors"

export abstract class MemoryRepository<Aggregate extends { id: string }> {
  protected readonly store: Record<string, Aggregate> = {}

  constructor(private readonly resourceName: string) { }

  async query(): Promise<Aggregate[]> {
    return Object.values(this.store)
  }

  async tryGet(filters: {}): Promise<Aggregate | undefined> {
    const entries = Object.entries(filters)
    const item = Object.values(this.store).find(obj => entries.every(([key, value]) => obj[key] === value))
    return Promise.resolve(item)
  }

  async get(filters: {}): Promise<Aggregate> {
    const item = await this.tryGet(filters)
    if (!item) {
      const filterString = Object.entries(filters).map(([key, value]) => `${key} ${value}`).join(", ")
      throw new NotFoundError(`${this.resourceName} with ${filterString} not found`)
    }

    return item
  }

  async tryGetById(id: string): Promise<Aggregate | undefined> {
    return await this.tryGet({ id })
  }

  async getById(id: string): Promise<Aggregate> {
    return await this.get({ id })
  }

  async insert(item: Aggregate): Promise<void> {
    this.store[item.id] = item
    return Promise.resolve()
  }

  async update(item: Aggregate): Promise<void> {
    this.store[item.id] = item
    return Promise.resolve()
  }

  async delete(id: string): Promise<void> {
    delete this.store[id]
    return Promise.resolve()
  }
}
