import { Event } from '~/domain/events';

export type EventCallback<T extends Event<any>> = (event: T) => void;

export interface EventPublisher {
  publishEvent<T extends Event<any>>(event: T): void;
}
