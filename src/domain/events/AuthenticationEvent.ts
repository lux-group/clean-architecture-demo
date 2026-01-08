import { randomUUID } from 'node:crypto';
import { Event } from './Event';

export interface AuthenticationEventDetails {
  userId?: string;
  sessionId?: string;
  identityProviderId?: string;
  identifierClaimValue?: string;
  method: 'Active Session' | 'Password' | 'Client Credentials' | 'Token Exchange' | 'Identity Provider';
}

export class AuthenticationEvent implements Event<AuthenticationEventDetails> {
  readonly topic = 'Authentication' as const;
  readonly id: string;
  readonly timestamp: Date;
  readonly result: 'Success' | 'Failed';
  readonly reason?: string;
  readonly details: AuthenticationEventDetails;

  constructor(
    id: string,
    timestamp: Date,
    result: 'Success' | 'Failed',
    details: AuthenticationEventDetails,
    reason?: string,
  ) {
    this.id = id;
    this.timestamp = timestamp;
    this.result = result;
    this.details = details;
    this.reason = reason;
  }

  static activeSessionVerified(userId: string, sessionId: string) {
    return AuthenticationEvent.success({
      method: 'Active Session',
      userId,
      sessionId,
    });
  }

  static passwordVerified(userId: string) {
    return AuthenticationEvent.success({
      method: 'Password',
      userId,
    });
  }

  static clientCredentialsVerified(userId: string) {
    return AuthenticationEvent.success({
      method: 'Client Credentials',
      userId,
    });
  }

  static externalTokenVerified(userId: string, identityProviderId: string, identifierClaimValue: string) {
    return AuthenticationEvent.success({
      method: 'Token Exchange',
      userId,
      identityProviderId,
      identifierClaimValue,
    });
  }

  static identityProviderCodeVerified(userId: string, identityProviderId: string, identifierClaimValue: string) {
    return AuthenticationEvent.success({
      method: 'Identity Provider',
      userId,
      identityProviderId,
      identifierClaimValue,
    });
  }

  private static success(details: AuthenticationEventDetails): AuthenticationEvent {
    return new AuthenticationEvent(randomUUID(), new Date(), 'Success', details);
  }
}
