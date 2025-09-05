import { randomBytes, randomUUID } from "node:crypto"
import z from "zod"
import { AuthenticationError, commonErrors, InvalidOperationError } from "../errors"
import { Entity, validateProps } from "./Entity"

export const SessionStatus = {
  Active: "ACTIVE",
  Expired: "EXPIRED",
  TerminatedByUser: "TERMINATED_BY_USER",
  TerminatedByAdmin: "TERMINATED_BY_ADMIN",
  TerminatedByProvider: "TERMINATED_BY_PROVIDER",
} as const

export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus]

const sessionSchema = z.object({
  id: z.uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastRefreshAt: z.date(),
  expiresAt: z.date(),
  terminatedAt: z.date().nullable(),
  status: z.enum(SessionStatus),
  nonce: z.string().min(40).max(40),
  userId: z.uuid(),
  identityProviderId: z.uuid().nullable(),
  identityProviderSessionId: z.string().max(100).nullable(),
  idToken: z.string().max(10000).nullable(),
  refreshToken: z.string().max(10000).nullable(),
})

export type SessionProps = Readonly<z.input<typeof sessionSchema>>
export type CreateSessionProps = Omit<
  SessionProps,
  "id" | "createdAt" | "updatedAt" | "lastRefreshAt" | "expiresAt" | "terminatedAt" | "status" | "nonce"
>

export class Session extends Entity<SessionProps> {
  get lastRefreshAt() {
    return this.props.lastRefreshAt
  }
  get expiresAt() {
    return this.props.expiresAt
  }
  get terminatedAt() {
    return this.props.terminatedAt
  }
  get status() {
    return this.props.status
  }
  get nonce() {
    return this.props.nonce
  }
  get userId() {
    return this.props.userId
  }
  get identityProviderId() {
    return this.props.identityProviderId
  }
  get identityProviderSessionId() {
    return this.props.identityProviderSessionId
  }
  get idToken() {
    return this.props.idToken
  }
  get refreshToken() {
    return this.props.refreshToken
  }

  get isActive() {
    return this.status === SessionStatus.Active && this.expiresAt > new Date()
  }

  static createNew(props: CreateSessionProps, expiresInHours: number) {
    const now = new Date()
    const allProps: SessionProps = {
      ...props,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      lastRefreshAt: now,
      expiresAt: new Date(Date.now() + expiresInHours * 3600000),
      terminatedAt: null,
      status: SessionStatus.Active,
      nonce: randomBytes(20).toString("hex"),
    }

    validateProps(sessionSchema, allProps)
    return new Session(allProps)
  }

  ensureIsActive() {
    if (!this.isActive) {
      throw new AuthenticationError(commonErrors.sessionExpired)
    }
  }

  verifyActiveSession(nonce: string) {
    if (nonce !== this.nonce) {
      throw new AuthenticationError(commonErrors.sessionInvalid)
    }

    if (!this.isActive) {
      throw new AuthenticationError(commonErrors.sessionExpired)
    }
  }

  ensureIsLocalSession() {
    if (this.identityProviderId) {
      throw new InvalidOperationError(commonErrors.mustBeLocalSession)
    }
  }

  ensureIsIdentityProviderSession() {
    if (!this.identityProviderId) {
      throw new InvalidOperationError(commonErrors.mustBeIdentityProviderSession)
    }
  }

  isIdentityProviderRefreshDue(minSessionRefreshDelayMinutes: number) {
    if (!this.identityProviderId) {
      return false
    }

    const elapsedTime = Date.now() - new Date(this.lastRefreshAt).getTime()
    return elapsedTime > minSessionRefreshDelayMinutes * 60000
  }

  setLastRefresh(idToken?: string, refreshToken?: string) {
    this.props = {
      ...this.props,
      updatedAt: new Date(),
      lastRefreshAt: new Date(),
      idToken: idToken ?? this.idToken,
      refreshToken: refreshToken ?? this.refreshToken,
    }
  }

  expire() {
    this.changeStatus(SessionStatus.Expired)
  }

  terminateLocalSessionByUser() {
    this.ensureIsLocalSession()
    this.changeStatus(SessionStatus.TerminatedByUser)
  }

  terminateIdentityProviderSessionByUser() {
    this.ensureIsIdentityProviderSession()
    this.changeStatus(SessionStatus.TerminatedByUser)
  }

  terminateSessionByIdentityProvider() {
    this.ensureIsIdentityProviderSession()
    this.changeStatus(SessionStatus.TerminatedByProvider)
  }

  terminateSessionByAdmin() {
    this.changeStatus(SessionStatus.TerminatedByAdmin)
  }

  private changeStatus(newStatus: SessionStatus) {
    if (this.status !== SessionStatus.Active) {
      return
    }

    if (newStatus === SessionStatus.Active) {
      throw new InvalidOperationError(commonErrors.sessionExpired)
    }

    if (this.expiresAt < new Date()) {
      this.props = { ...this.props, refreshToken: null, status: SessionStatus.Expired, terminatedAt: this.expiresAt }
    } else {
      this.props = { ...this.props, refreshToken: null, status: newStatus, terminatedAt: new Date() }
    }
  }
}
