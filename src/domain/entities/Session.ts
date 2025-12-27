import { randomBytes, randomUUID } from 'node:crypto';
import { AuthenticationError, InvalidOperationError } from '../errors';

export const SessionStatus = {
  Active: 'ACTIVE',
  Expired: 'EXPIRED',
  TerminatedByUser: 'TERMINATED_BY_USER',
  TerminatedByAdmin: 'TERMINATED_BY_ADMIN',
  TerminatedByProvider: 'TERMINATED_BY_PROVIDER',
} as const;

export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];

export type Session = Readonly<{
  id: string;
  createdAt: Date;
  updatedAt: Date;
  lastRefreshAt: Date;
  expiresAt: Date;
  terminatedAt: Date | null;
  status: SessionStatus;
  nonce: string;
  userId: string;
  identityProviderId: string | null;
  identityProviderSessionId: string | null;
  idToken: string | null;
  refreshToken: string | null;
}>;

export type CreateSessionProps = Omit<
  Session,
  'id' | 'createdAt' | 'updatedAt' | 'lastRefreshAt' | 'expiresAt' | 'terminatedAt' | 'status' | 'nonce'
>;

function changeStatus(session: Session, newStatus: SessionStatus, now: Date): Session {
  if (session.status !== SessionStatus.Active) {
    return session;
  }

  if (newStatus === SessionStatus.Active) {
    throw InvalidOperationError.sessionExpired(session.id);
  }

  if (session.expiresAt < now) {
    return {
      ...session,
      updatedAt: now,
      refreshToken: null,
      status: SessionStatus.Expired,
      terminatedAt: session.expiresAt,
    };
  }

  return {
    ...session,
    updatedAt: now,
    refreshToken: null,
    status: newStatus,
    terminatedAt: now,
  };
}

export const Session = {
  isActive(session: Session, now: Date = new Date()): boolean {
    return session.status === SessionStatus.Active && session.expiresAt > now;
  },

  createNew(props: CreateSessionProps, expiresInHours: number, now: Date = new Date()): Session {
    return {
      ...props,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      lastRefreshAt: now,
      expiresAt: new Date(now.getTime() + expiresInHours * 3600000),
      terminatedAt: null,
      status: SessionStatus.Active,
      nonce: randomBytes(20).toString('hex'),
    };
  },

  ensureIsActive(session: Session, now: Date = new Date()): void {
    if (!Session.isActive(session, now)) {
      throw AuthenticationError.sessionExpired(session.id, session.userId);
    }
  },

  ensureIsLocalSession(session: Session): void {
    if (session.identityProviderId) {
      throw InvalidOperationError.sessionMustBeLocal(session.id);
    }
  },

  ensureIsIdentityProviderSession(session: Session): void {
    if (!session.identityProviderId) {
      throw InvalidOperationError.sessionMustBeExternal(session.id);
    }
  },

  verifyNonce(session: Session, nonce: string): void {
    if (session.nonce !== nonce) {
      throw Error('Nonce mismatch indicating potential session hijacking attempt detected.');
    }
  },

  isIdentityProviderRefreshDue(
    session: Session,
    minSessionRefreshDelayMinutes: number,
    now: Date = new Date(),
  ): boolean {
    if (!session.identityProviderId) {
      return false;
    }

    const elapsedTime = now.getTime() - session.lastRefreshAt.getTime();
    return elapsedTime > minSessionRefreshDelayMinutes * 60000;
  },

  setLastRefresh(session: Session, idToken?: string, refreshToken?: string, now: Date = new Date()): Session {
    return {
      ...session,
      updatedAt: now,
      lastRefreshAt: now,
      idToken: idToken ?? session.idToken,
      refreshToken: refreshToken ?? session.refreshToken,
    };
  },

  expire(session: Session, now: Date = new Date()): Session {
    return changeStatus(session, SessionStatus.Expired, now);
  },

  terminateLocalSessionByUser(session: Session, now: Date = new Date()): Session {
    Session.ensureIsLocalSession(session);
    return changeStatus(session, SessionStatus.TerminatedByUser, now);
  },

  terminateIdentityProviderSessionByUser(session: Session, now: Date = new Date()): Session {
    Session.ensureIsIdentityProviderSession(session);
    return changeStatus(session, SessionStatus.TerminatedByUser, now);
  },

  terminateSessionByIdentityProvider(session: Session, now: Date = new Date()): Session {
    Session.ensureIsIdentityProviderSession(session);
    return changeStatus(session, SessionStatus.TerminatedByProvider, now);
  },

  terminateSessionByAdmin(session: Session, now: Date = new Date()): Session {
    return changeStatus(session, SessionStatus.TerminatedByAdmin, now);
  },
} as const;
