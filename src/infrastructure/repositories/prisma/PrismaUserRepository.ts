import { Prisma, User as PrismaUser, UserIdentity as PrismaUserIdentity } from "@prisma/client"
import { User, UserIdentity } from "~/domain/entities"
import { NotFoundError } from "~/domain/errors"
import { UserRepository } from "~/domain/repositories"
import { MapperBuilder } from "~/lib/MapperBuilder"
import { Query, QueryResult } from "~/lib/types"
import { mapQuery } from "./helpers"
import { PrismaClient } from "./PrismaClient"

type PrismaUserWithIdentities = PrismaUser & {
  identities: PrismaUserIdentity[]
}

export class PrismaUserRepository implements UserRepository {
  constructor(private prismaClient: PrismaClient) {}

  async query(options: Query<User>): Promise<QueryResult<User>> {
    const query = mapQuery(options, ["identities"]) as Prisma.UserFindManyArgs
    const [total, users] = await this.prismaClient
      .$replica()
      .$transaction([
        this.prismaClient.$replica().user.count({ where: query.where }),
        this.prismaClient.$replica().user.findMany(query),
      ])

    return {
      items: users.map((u: any) => this.mapFromPrismaUser(u)),
      total,
    }
  }

  async getById(id: string): Promise<User> {
    const user = await this.tryGetById(id)
    if (!user) {
      throw new NotFoundError(`User with id ${id} not found`)
    }

    return user
  }

  async tryGetById(id: string): Promise<User | undefined> {
    const user = await this.prismaClient.$primary().user.findUnique({
      where: { id },
      include: { identities: true },
    })

    return user ? this.mapFromPrismaUser(user) : undefined
  }

  async tryGetByBrandAndEmail(brand: string, email: string): Promise<User | undefined> {
    const user = await this.prismaClient.$primary().user.findUnique({
      where: {
        unique_brand_email: {
          brand,
          email,
        },
      },
      include: {
        identities: true,
      },
    })

    return user ? this.mapFromPrismaUser(user) : undefined
  }

  async tryGetByExternalIdentity(identityProviderId: string, identifierClaimValue: string): Promise<User | undefined> {
    const userIdentity = await this.prismaClient.$primary().userIdentity.findUnique({
      where: {
        unique_identity_provider_claim: {
          identityProviderId,
          identifierClaimValue,
        },
      },
      include: {
        user: {
          include: {
            identities: true,
          },
        },
      },
    })

    return userIdentity ? this.mapFromPrismaUser(userIdentity.user) : undefined
  }

  async insert(user: User): Promise<void> {
    await this.prismaClient.$primary().user.create({
      data: {
        ...this.mapToPrismaUser(user),
        identities: {
          create: user.identities.map(identity => this.mapToPrismaUserIdentity(identity)),
        },
      },
    })

    user.commit()
  }

  async update(user: User): Promise<void> {
    await this.prismaClient.$primary().user.update({
      where: { id: user.id, updatedAt: user.originalUpdatedAt },
      data: {
        ...this.mapToPrismaUser(user),
        identities: {
          deleteMany: { id: { notIn: user.identities.map(identity => identity.id) } },
          upsert: user.identities.map(identity => ({
            where: { id: identity.id },
            update: this.mapToPrismaUserIdentity(identity),
            create: this.mapToPrismaUserIdentity(identity),
          })),
        },
      },
    })

    user.commit()
  }

  async delete(user: User): Promise<void> {
    await this.prismaClient.$primary().user.delete({
      where: { id: user.id, updatedAt: user.originalUpdatedAt },
    })
  }

  private mapFromPrismaUserIdentity = MapperBuilder.for<PrismaUserIdentity>().omit("userId").build<UserIdentity>()

  private mapToPrismaUserIdentity = MapperBuilder.for<UserIdentity>().build<PrismaUserIdentity>()

  private mapFromPrismaUser = MapperBuilder.for<PrismaUserWithIdentities>()
    .mapProperty("identities", identities => identities.map(this.mapFromPrismaUserIdentity))
    .map(props => new User(props))
    .build<User>()

  private mapToPrismaUser = MapperBuilder.for<User>()
    .map(user => user.props)
    .omit("identities")
    .build<PrismaUser>()
}
