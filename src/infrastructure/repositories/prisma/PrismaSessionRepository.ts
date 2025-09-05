import { Prisma, Session as PrismaSession } from "@prisma/client"
import { Query, QueryResult } from "~/lib/types"
import { EncryptionProvider } from "~/infrastructure/crypto"
import { NotFoundError } from "~/domain/errors"
import { Session, SessionStatus } from "~/domain/entities"
import { SessionRepository } from "~/domain/repositories"
import { PrismaClient } from "./PrismaClient"
import { mapQuery } from "./helpers"

export class PrismaSessionRepository implements SessionRepository {
  constructor(
    private readonly prismaClient: PrismaClient,
    private readonly encryptionProvider: EncryptionProvider,
  ) {}

  async query(options: Query<Session>): Promise<QueryResult<Session>> {
    const query = mapQuery(options) as Prisma.SessionFindManyArgs
    const [total, sessions] = await this.prismaClient
      .$replica()
      .$transaction([this.prismaClient.$replica().session.count({ where: query.where }), this.prismaClient.$replica().session.findMany(query)])

    return {
      items: sessions.map(s => this.mapToSession(s)),
      total,
    }
  }

  async getById(id: string): Promise<Session> {
    const session = await this.tryGetById(id)
    if (!session) {
      throw new NotFoundError(`Session with id ${id} not found`)
    }

    return session
  }

  async tryGetById(id: string): Promise<Session | undefined> {
    const session = await this.prismaClient.$primary().session.findUnique({
      where: { id },
    })

    return session ? this.mapToSession(session) : undefined
  }

  async tryGetByIdentityProviderSessionId(identityProviderSessionId: string): Promise<Session | undefined> {
    const session = await this.prismaClient.$primary().session.findUnique({
      where: { identityProviderSessionId },
    })

    return session ? this.mapToSession(session) : undefined
  }

  async insert(session: Session): Promise<void> {
    await this.prismaClient.$primary().session.create({
      data: this.mapToPrismaSession(session),
    })
  }

  async update(session: Session): Promise<void> {
    await this.prismaClient.$primary().session.update({
      where: { id: session.id, updatedAt: session.originalUpdatedAt },
      data: this.mapToPrismaSession(session),
    })

    session.commit()
  }

  async delete(session: Session): Promise<void> {
    await this.prismaClient.$primary().session.delete({
      where: { id: session.id, updatedAt: session.originalUpdatedAt },
    })
  }

  private mapToSession(s: PrismaSession): Session {
    return new Session({
      id: s.id,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      lastRefreshAt: s.lastRefreshAt,
      expiresAt: s.expiresAt,
      terminatedAt: s.terminatedAt,
      status: s.status as SessionStatus,
      nonce: s.nonce,
      userId: s.userId,
      identityProviderId: s.identityProviderId,
      identityProviderSessionId: s.identityProviderSessionId,
      idToken: s.idToken,
      refreshToken: s.refreshToken ? this.encryptionProvider.decrypt(s.refreshToken) : null,
    })
  }

  private mapToPrismaSession(session: Session): PrismaSession {
    return {
      id: session.id,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      lastRefreshAt: session.lastRefreshAt,
      expiresAt: session.expiresAt,
      terminatedAt: session.terminatedAt,
      status: session.status,
      nonce: session.nonce,
      userId: session.userId,
      identityProviderId: session.identityProviderId,
      identityProviderSessionId: session.identityProviderSessionId,
      idToken: session.idToken,
      refreshToken: session.refreshToken ? this.encryptionProvider.encrypt(session.refreshToken) : null,
    } as PrismaSession
  }
}
