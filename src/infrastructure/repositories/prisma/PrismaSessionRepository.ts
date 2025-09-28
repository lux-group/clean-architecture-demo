import { Prisma, Session as PrismaSession } from "@prisma/client"
import { EncryptionProvider } from "~/app/ports"
import { Session, SessionStatus } from "~/domain/entities"
import { NotFoundError } from "~/domain/errors"
import { SessionRepository } from "~/domain/repositories"
import { MapperBuilder } from "~/lib/MapperBuilder"
import { Query, QueryResult } from "~/lib/types"
import { mapQuery } from "./helpers"
import { PrismaClient } from "./PrismaClient"

export class PrismaSessionRepository implements SessionRepository {
  constructor(
    private readonly prismaClient: PrismaClient,
    private readonly encryptionProvider: EncryptionProvider,
  ) {}

  async query(options: Query<Session>): Promise<QueryResult<Session>> {
    const query = mapQuery(options) as Prisma.SessionFindManyArgs
    const [total, sessions] = await this.prismaClient
      .$replica()
      .$transaction([
        this.prismaClient.$replica().session.count({ where: query.where }),
        this.prismaClient.$replica().session.findMany(query),
      ])

    return {
      items: sessions.map(s => this.mapFromPrismaSession(s)),
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

    return session ? this.mapFromPrismaSession(session) : undefined
  }

  async tryGetByIdentityProviderSessionId(identityProviderSessionId: string): Promise<Session | undefined> {
    const session = await this.prismaClient.$primary().session.findUnique({
      where: { identityProviderSessionId },
    })

    return session ? this.mapFromPrismaSession(session) : undefined
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

  private mapFromPrismaSession = MapperBuilder.for<PrismaSession>()
    .mapProperty("status", status => status as SessionStatus)
    .mapProperty("refreshToken", refreshToken => (refreshToken ? this.encryptionProvider.decrypt(refreshToken) : null))
    .map(props => new Session(props))
    .build<Session>()

  private mapToPrismaSession = MapperBuilder.for<Session>()
    .map(props => props.props)
    .mapProperty("status", status => status as PrismaSession["status"])
    .mapProperty("refreshToken", refreshToken => (refreshToken ? this.encryptionProvider.encrypt(refreshToken) : null))
    .build<PrismaSession>()
}
