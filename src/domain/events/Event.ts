export interface Event<T extends Record<string, any>> {
  readonly topic: string;
  readonly id: string;
  readonly timestamp: Date;
  readonly result: 'Success' | 'Failed' | 'Warning';
  readonly reason?: string;
  readonly details: T;
}
