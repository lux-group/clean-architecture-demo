import { randomUUID } from 'node:crypto';
import { Event } from './Event';

export interface AuthorizationEventDetails {
  userId?: string;
  userToImpersonateId?: string;
  sessionId?: string;
  claims?: Record<string, unknown>;
}

export class AuthorizationEvent implements Event<AuthorizationEventDetails> {
  readonly topic = 'Authorization' as const;
  readonly id: string;
  readonly timestamp: Date;
  readonly result: 'Success' | 'Failed';
  readonly reason?: string;
  readonly details: AuthorizationEventDetails;

  constructor(
    id: string,
    timestamp: Date,
    result: 'Success' | 'Failed',
    details: AuthorizationEventDetails,
    reason?: string,
  ) {
    this.id = id;
    this.timestamp = timestamp;
    this.result = result;
    this.details = details;
    this.reason = reason;
  }

  static tokenIssued(claims: Record<string, unknown>, userId: string, sessionId?: string) {
    return AuthorizationEvent.success({
      sessionId,
      userId,
      claims,
    });
  }

  private static success(details: AuthorizationEventDetails): AuthorizationEvent {
    return new AuthorizationEvent(randomUUID(), new Date(), 'Success', details);
  }
}
