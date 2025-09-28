import {
  Prisma,
  IdentityProvider as PrismaIdentityProvider,
  IdentityProviderAuthSettings as PrismaIdentityProviderAuthSettings,
} from "@prisma/client"
import { EncryptionProvider } from "~/app/ports"
import { IdentityProvider, IdentityProviderAuthSettings, IdentityProviderType } from "~/domain/entities"
import { NotFoundError } from "~/domain/errors"
import { IdentityProviderRepository } from "~/domain/repositories"
import { MapperBuilder } from "~/lib/MapperBuilder"
import { Query, QueryResult } from "~/lib/types"
import { mapQuery } from "./helpers"
import { PrismaClient } from "./PrismaClient"

type PrismaIdentityProviderWithAuth = PrismaIdentityProvider & {
  authSettings: PrismaIdentityProviderAuthSettings | null
}

export class PrismaIdentityProviderRepository implements IdentityProviderRepository {
  constructor(
    private readonly prismaClient: PrismaClient,
    private readonly encryptionProvider: EncryptionProvider,
  ) {}

  async query(options: Query<IdentityProvider>): Promise<QueryResult<IdentityProvider>> {
    const query = mapQuery(options, ["authSettings"]) as Prisma.IdentityProviderFindManyArgs
    const [total, identityProviders] = await this.prismaClient
      .$replica()
      .$transaction([
        this.prismaClient.$replica().identityProvider.count({ where: query.where }),
        this.prismaClient.$replica().identityProvider.findMany(query),
      ])

    return {
      items: identityProviders.map(idp => this.mapFromPrismaIdentityProvider(idp as PrismaIdentityProviderWithAuth)),
      total,
    }
  }

  async getById(id: string): Promise<IdentityProvider> {
    const identityProvider = await this.tryGetById(id)
    if (!identityProvider) {
      throw new NotFoundError(`Identity provider with id ${id} not found.`)
    }

    return identityProvider
  }

  async tryGetById(id: string): Promise<IdentityProvider | undefined> {
    const identityProvider = await this.prismaClient.$primary().identityProvider.findUnique({
      where: { id },
      include: { authSettings: true },
    })

    return identityProvider
      ? this.mapFromPrismaIdentityProvider(identityProvider as PrismaIdentityProviderWithAuth)
      : undefined
  }

  async tryGetByName(name: string): Promise<IdentityProvider | undefined> {
    const identityProvider = await this.prismaClient.$primary().identityProvider.findUnique({
      where: { name },
      include: { authSettings: true },
    })

    return identityProvider
      ? this.mapFromPrismaIdentityProvider(identityProvider as PrismaIdentityProviderWithAuth)
      : undefined
  }

  async tryGetByIssuerUrlAndAudience(issuerUrl: string, audience: string): Promise<IdentityProvider | undefined> {
    const identityProvider = await this.prismaClient.$primary().identityProvider.findUnique({
      where: {
        unique_issuer_audience: {
          issuerUrl,
          audience,
        },
      },
      include: { authSettings: true },
    })

    return identityProvider
      ? this.mapFromPrismaIdentityProvider(identityProvider as PrismaIdentityProviderWithAuth)
      : undefined
  }

  async insert(identityProvider: IdentityProvider): Promise<void> {
    await this.prismaClient.$primary().identityProvider.create({
      data: {
        ...this.mapToPrismaIdentityProvider(identityProvider),
        authSettings: identityProvider.authSettings
          ? {
              create: this.mapToPrismaIdentityProviderAuthSettings(identityProvider.authSettings!),
            }
          : undefined,
      },
    })

    identityProvider.commit()
  }

  async update(identityProvider: IdentityProvider): Promise<void> {
    await this.prismaClient.$primary().identityProvider.update({
      where: { id: identityProvider.id, updatedAt: identityProvider.originalUpdatedAt },
      data: {
        ...this.mapToPrismaIdentityProvider(identityProvider),
        authSettings: {
          delete: !!identityProvider.authSettings,
          upsert: identityProvider.authSettings
            ? {
                where: { id: identityProvider.id },
                update: this.mapToPrismaIdentityProviderAuthSettings(identityProvider.authSettings),
                create: this.mapToPrismaIdentityProviderAuthSettings(identityProvider.authSettings),
              }
            : undefined,
        },
      },
    })

    identityProvider.commit()
  }

  async delete(identityProvider: IdentityProvider): Promise<void> {
    await this.prismaClient.$primary().identityProvider.delete({
      where: { id: identityProvider.id, updatedAt: identityProvider.originalUpdatedAt },
    })
  }

  private mapFromPrismaIdentityProviderAuthSettings = MapperBuilder.for<PrismaIdentityProviderAuthSettings>()
    .omit("id", "identityProviderId")
    .mapProperty("type", type => type as IdentityProviderType)
    .mapProperty("clientSecret", clientSecret => this.encryptionProvider.decrypt(clientSecret))
    .build<IdentityProviderAuthSettings>()

  private mapToPrismaIdentityProviderAuthSettings = MapperBuilder.for<IdentityProviderAuthSettings>()
    .mapProperty("type", type => type as PrismaIdentityProviderAuthSettings["type"])
    .mapProperty("clientSecret", clientSecret => this.encryptionProvider.encrypt(clientSecret))
    .build<PrismaIdentityProviderAuthSettings>()

  private mapFromPrismaIdentityProvider = MapperBuilder.for<PrismaIdentityProviderWithAuth>()
    .mapProperty("authSettings", auth => (auth ? this.mapFromPrismaIdentityProviderAuthSettings(auth) : null))
    .map(props => new IdentityProvider(props))
    .build<IdentityProvider>()

  private mapToPrismaIdentityProvider = MapperBuilder.for<IdentityProvider>()
    .map(props => props.props)
    .omit("authSettings")
    .build<PrismaIdentityProvider>()
}
