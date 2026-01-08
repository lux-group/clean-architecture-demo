import { Entity } from '~/domain/entities';
import { NotFoundError } from '~/domain/errors';
import { Repository } from '~/domain/repositories';
import { Query, QueryResult } from '~/lib/types';

export abstract class MemoryRepository<T extends Entity> implements Repository<T> {
  protected readonly store: Record<string, T> = {};

  constructor(private readonly resourceName: string) {}

  async query(options: Query<T>): Promise<QueryResult<T>> {
    const entities = Object.values(this.store);
    return {
      items: entities.slice(options.offset, options.offset + options.limit),
      total: entities.length,
    };
  }

  async tryGet(filters: Record<string, unknown>): Promise<T | undefined> {
    const entities = Object.entries(filters);
    const entity = Object.values(this.store).find(obj =>
      entities.every(([key, value]) => (obj as unknown as Record<string, unknown>)[key] === value),
    );
    return entity;
  }

  async get(filters: Record<string, unknown>): Promise<T> {
    const entity = await this.tryGet(filters);
    if (!entity) {
      const filterString = Object.entries(filters)
        .map(([key, value]) => `${key} ${value}`)
        .join(', ');
      throw new NotFoundError(`${this.resourceName} with ${filterString} not found`);
    }

    return entity;
  }

  async tryGetById(id: string): Promise<T | undefined> {
    return this.tryGet({ id });
  }

  async getById(id: string): Promise<T> {
    return this.get({ id });
  }

  async insert(entity: T): Promise<void> {
    this.store[entity.id] = entity;
    return;
  }

  async update(entity: T): Promise<void> {
    const existing = this.store[entity.id];
    if (!existing) {
      throw new NotFoundError(`${this.resourceName} with id ${entity.id} not found`);
    }

    this.store[entity.id] = entity;
    return;
  }

  async delete(entity: T): Promise<void> {
    const existing = this.store[entity.id];
    if (!existing) {
      throw new NotFoundError(`${this.resourceName} with id ${entity.id} not found`);
    }

    delete this.store[entity.id];
    return;
  }
}
