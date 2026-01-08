import { randomUUID } from 'node:crypto';
import { Entity } from '../entities';
import { Event } from './Event';

export type EntityType = 'Identity Provider' | 'Session' | 'Signing Key' | 'User';

export type EntityChangeActivity = 'Created' | 'Updated' | 'Deleted';

export type EntityChangeResult = 'Success';

export interface EntityChangeEventDetails {
  activity: EntityChangeActivity;
  entityType: EntityType;
  entityId: string;
}

export class EntityChangeEvent implements Event<EntityChangeEventDetails> {
  readonly topic = 'Entity Changed' as const;
  readonly id: string;
  readonly timestamp: Date;
  readonly result: EntityChangeResult;
  readonly details: EntityChangeEventDetails;

  private constructor(id: string, timestamp: Date, result: EntityChangeResult, details: EntityChangeEventDetails) {
    this.id = id;
    this.timestamp = timestamp;
    this.result = result;
    this.details = details;
  }

  static entityCreated(entityType: EntityType, entity: Entity) {
    return EntityChangeEvent.success(entity.createdAt, {
      activity: 'Created',
      entityId: entity.id,
      entityType: entityType,
    });
  }

  static entityUpdated(entityType: EntityType, entity: Entity) {
    return EntityChangeEvent.success(entity.updatedAt, {
      activity: 'Updated',
      entityId: entity.id,
      entityType: entityType,
    });
  }

  static entityDeleted(entityType: EntityType, entityId: string) {
    return EntityChangeEvent.success(new Date(), {
      activity: 'Deleted',
      entityId: entityId,
      entityType: entityType,
    });
  }

  private static success(timestamp: Date, details: EntityChangeEventDetails): EntityChangeEvent {
    return new EntityChangeEvent(randomUUID(), timestamp, 'Success', details);
  }
}
