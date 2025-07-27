import { User as PrismaUser, UserIdentity as PrismaUserIdentity } from "@prisma/client"
import { PrismaClient } from "./PrismaClient"
import { NotFoundError } from "~/domain/errors"
import { User, UserIdentity } from "~/domain/entities"
import { UserRepository } from "~/domain/repositories"

type PrismaUserWithIdentities = PrismaUser & {
  identities: PrismaUserIdentity[]
}

export class PrismaUserRepository implements UserRepository {
  constructor(private prismaClient: PrismaClient) {}

  async query(): Promise<User[]> {
    const users = await this.prismaClient.user.findMany({
      include: { identities: true }
    })

    return users.map(u => this.mapToUser(u))
  }

  async getById(id: string): Promise<User> {
    const user = await this.tryGetById(id)
    if (!user) {
      throw new NotFoundError(`User with id ${id} not found`)
    }

    return user
  }

  async tryGetById(id: string): Promise<User | undefined> {
    const user = await this.prismaClient.user.findUnique({
      where: { id },
      include: { identities: true }
    })

    return user ? this.mapToUser(user) : undefined
  }

  async tryGetByBrandAndEmail(brand: string, email: string): Promise<User | undefined> {
    const user = await this.prismaClient.user.findUnique({
      where: {
        unique_brand_email: {
          brand,
          email
        }
      },
      include: {
        identities: true
      }
    })

    return user ? this.mapToUser(user) : undefined
  }

  async tryGetByExternalIdentity(identityProviderId: string, identifierClaimValue: string): Promise<User | undefined> {
    const userIdentity = await this.prismaClient.userIdentity.findUnique({
      where: {
        unique_identity_provider_claim: {
          identityProviderId,
          identifierClaimValue
        }
      },
      include: {
        user: {
          include: {
            identities: true
          }
        }
      }
    })

    return userIdentity ? this.mapToUser(userIdentity.user) : undefined
  }

  async insert(user: User): Promise<void> {
    await this.prismaClient.user.create({
      data: {
        ...this.mapToPrismaUser(user),
        identities: {
          create: user.identities.map(identity => this.mapToPrismaUserIdentity(user, identity))
        }
      }
    })
  }

  async update(user: User): Promise<void> {
    await this.prismaClient.user.update({
      where: { id: user.id, updatedAt: user.originalUpdatedAt },
      data: {
        ...this.mapToPrismaUser(user),
        identities: {
          deleteMany: { id: { notIn: user.identities.map(identity => identity.id) } },
          upsert: user.identities.map(identity => ({
            where: { id: identity.id },
            update: this.mapToPrismaUserIdentity(user, identity),
            create: this.mapToPrismaUserIdentity(user, identity)
          })),
        }
      }
    })

    user.commit()
  }

  async delete(id: string): Promise<void> {
    await this.prismaClient.user.delete({
      where: { id }
    })
  }

  private mapToUser(u: PrismaUserWithIdentities): User {
    return new User({
      id: u.id,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      isEnabled: u.isEnabled,
      brand: u.brand,
      givenName: u.givenName,
      surname: u.surname,
      email: u.email,
      emailVerified: u.emailVerified,
      phone: u.phone,
      country: u.country,
      city: u.city,
      postcode: u.postcode,
      passwordHash: u.passwordHash,
      roles: u.roles,
      identities: u.identities.map(ui => this.mapToUserIdentity(ui))
    })
  }

  private mapToUserIdentity(i: PrismaUserIdentity): UserIdentity {
    return {
      id: i.id,
      identityProviderId: i.identityProviderId,
      identifierClaimValue: i.identifierClaimValue
    } as UserIdentity
  }

  private mapToPrismaUser(u: User): PrismaUser {
    return {
      id: u.id,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      isEnabled: u.isEnabled,
      brand: u.brand,
      givenName: u.givenName,
      surname: u.surname,
      email: u.email,
      emailVerified: u.emailVerified,
      phone: u.phone,
      country: u.country,
      city: u.city,
      postcode: u.postcode,
      passwordHash: u.passwordHash,
      roles: u.roles as string[]
    } as PrismaUser
  }

  private mapToPrismaUserIdentity(u: User, i: UserIdentity): Omit<PrismaUserIdentity, 'userId'> {
    return {
      id: i.id,
      identityProviderId: i.identityProviderId,
      identifierClaimValue: i.identifierClaimValue
    } as PrismaUserIdentity
  }
}
