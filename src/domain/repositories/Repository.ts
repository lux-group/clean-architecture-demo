import { Entity } from '~/domain/entities';
import { Query, QueryResult } from '~/lib/types';

export interface Repository<T extends Entity> {
  query(options: Query<T>): Promise<QueryResult<T>>;
  getById(id: string): Promise<T>;
  tryGetById(id: string): Promise<T | undefined>;
  insert(entity: T): Promise<void>;
  update(entity: T): Promise<void>;
  delete(entity: T): Promise<void>;
}
