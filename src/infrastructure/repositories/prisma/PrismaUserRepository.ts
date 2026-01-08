import { Prisma, User as PrismaUser, UserIdentity as PrismaUserIdentity } from '@prisma/client';
import { User, UserIdentity } from '~/domain/entities';
import { NotFoundError } from '~/domain/errors';
import { UserRepository } from '~/domain/repositories';
import { Query, QueryResult } from '~/lib/types';
import { mapQuery } from './helpers';
import { PrismaClient } from './PrismaClient';

type PrismaUserWithIdentities = PrismaUser & {
  identities: PrismaUserIdentity[];
};

export class PrismaUserRepository implements UserRepository {
  constructor(private prismaClient: PrismaClient) {}

  async query(options: Query<User>): Promise<QueryResult<User>> {
    const query = mapQuery(options, ['identities']) as Prisma.UserFindManyArgs;
    const [total, users] = await this.prismaClient
      .$replica()
      .$transaction([
        this.prismaClient.$replica().user.count({ where: query.where }),
        this.prismaClient.$replica().user.findMany(query),
      ]);

    return {
      items: users.map(u => this.mapFromPrismaUser(u as PrismaUserWithIdentities)),
      total,
    };
  }

  async getById(id: string): Promise<User> {
    const user = await this.tryGetById(id);
    if (!user) {
      throw new NotFoundError(`User with id ${id} not found`);
    }

    return user;
  }

  async tryGetById(id: string): Promise<User | undefined> {
    const user = await this.prismaClient.$primary().user.findUnique({
      where: { id },
      include: { identities: true },
    });

    return user ? this.mapFromPrismaUser(user as PrismaUserWithIdentities) : undefined;
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
    });

    return user ? this.mapFromPrismaUser(user as PrismaUserWithIdentities) : undefined;
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
    });

    return userIdentity ? this.mapFromPrismaUser(userIdentity.user as PrismaUserWithIdentities) : undefined;
  }

  async insert(user: User): Promise<void> {
    await this.prismaClient.$primary().user.create({
      data: {
        ...this.mapToPrismaUser(user),
        identities: {
          create: user.identities.map(identity => this.mapToPrismaUserIdentityCreate(identity)),
        },
      },
    });
  }

  async update(user: User): Promise<void> {
    await this.prismaClient.$primary().user.update({
      where: { id: user.id },
      data: {
        ...this.mapToPrismaUser(user),
        identities: {
          deleteMany: { id: { notIn: user.identities.map(identity => identity.id) } },
          upsert: user.identities.map(identity => ({
            where: { id: identity.id },
            update: this.mapToPrismaUserIdentityUpdate(identity),
            create: this.mapToPrismaUserIdentityCreate(identity),
          })),
        },
      },
    });
  }

  async delete(user: User): Promise<void> {
    await this.prismaClient.$primary().user.delete({
      where: { id: user.id },
    });
  }

  private mapFromPrismaUserIdentity(prismaIdentity: PrismaUserIdentity): UserIdentity {
    return {
      id: prismaIdentity.id,
      identityProviderId: prismaIdentity.identityProviderId,
      identifierClaimValue: prismaIdentity.identifierClaimValue,
    };
  }

  private mapToPrismaUserIdentityCreate(identity: UserIdentity): Prisma.UserIdentityCreateWithoutUserInput {
    return {
      id: identity.id,
      identifierClaimValue: identity.identifierClaimValue,
      identityProvider: {
        connect: {
          id: identity.identityProviderId,
        },
      },
    };
  }

  private mapToPrismaUserIdentityUpdate(identity: UserIdentity): Prisma.UserIdentityUpdateWithoutUserInput {
    return {
      identifierClaimValue: identity.identifierClaimValue,
    };
  }

  private mapFromPrismaUser(prismaUser: PrismaUserWithIdentities): User {
    return {
      ...prismaUser,
      identities: prismaUser.identities.map(i => this.mapFromPrismaUserIdentity(i)),
    };
  }

  private mapToPrismaUser(user: User): PrismaUser {
    const { identities: _identities, ...prismaUser } = user;
    return prismaUser as PrismaUser;
  }
}
