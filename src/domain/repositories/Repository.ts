import { Entity, EntityProps } from "../entities"

export interface Repository<T extends Entity<EntityProps>> {
  query(): Promise<T[]>
  getById(id: string): Promise<T>
  tryGetById(id: string): Promise<T | undefined>
  insert(entity: T): Promise<void>
  update(entity: T): Promise<void>
  delete(entity: T): Promise<void>
}
