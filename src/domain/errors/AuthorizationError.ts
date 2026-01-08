import { randomUUID } from 'node:crypto';
import { AuthorizationEvent, AuthorizationEventDetails } from '../events';
import { DomainError } from './DomainError';

export class AuthorizationError extends DomainError {
  constructor(
    message: string,
    public readonly details: AuthorizationEventDetails,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  static impersonationNotAllowed(impersonatingUserId: string, userToImpersonateId: string, reason: string) {
    return new AuthorizationError(
      `User ${impersonatingUserId} is not authorized to impersonate user ${userToImpersonateId}. ${reason}`,
      {
        userId: impersonatingUserId,
        userToImpersonateId: userToImpersonateId,
      },
    );
  }

  static unauthorizedAudience(audience: string, userId: string, sessionId?: string) {
    return new AuthorizationError(`Subject to authorized for audience ${audience}`, {
      userId,
      sessionId,
    });
  }

  static unauthorizedScope(scope: string, userId: string, sessionId?: string) {
    return new AuthorizationError(`Subject to authorized for scope ${scope}`, {
      userId,
      sessionId,
    });
  }

  toEvent() {
    return new AuthorizationEvent(randomUUID(), new Date(), 'Failed', this.details, this.message);
  }
}
