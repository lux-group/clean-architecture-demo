type Entity = { id: string, updatedAt: Date }
type CacheItem<TValue> = { value: TValue, updatedAt: Date }

export class ClientCache<TEntity extends Entity, TValue> {
  private readonly items: Record<string, CacheItem<TValue>> = {}

  constructor(private readonly factory: (entity: TEntity) => Promise<TValue>) { }

  async get(entity: TEntity): Promise<TValue> {
    let item = this.items[entity.id]

    if (!item || item.updatedAt != entity.updatedAt) {
      item = { updatedAt: entity.updatedAt, value: await this.factory(entity) }
      this.items[entity.id] = item
    }

    return item.value
  }
}
