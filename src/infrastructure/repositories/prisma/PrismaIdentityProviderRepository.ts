import { IdentityProvider as PrismaIdentityProvider } from "@prisma/client"
import { PrismaClient } from "./PrismaClient"
import { EncryptionProvider } from "~/infrastructure/crypto"
import { NotFoundError } from "~/domain/errors"
import { IdentityProvider, IdentityProviderType } from "~/domain/entities"
import { IdentityProviderRepository } from "~/domain/repositories"

export class PrismaIdentityProviderRepository implements IdentityProviderRepository {
  constructor(
    private readonly prismaClient: PrismaClient,
    private readonly encryptionProvider: EncryptionProvider
  ) { }

  async query(): Promise<IdentityProvider[]> {
    const identityProviders = await this.prismaClient.identityProvider.findMany()
    return identityProviders.map(idp => this.mapToIdentityProvider(idp))
  }

  async getById(id: string): Promise<IdentityProvider> {
    const identityProvider = await this.tryGetById(id)
    if (!identityProvider) {
      throw new NotFoundError(`Identity provider with id ${id} not found.`)
    }

    return identityProvider
  }

  async tryGetById(id: string): Promise<IdentityProvider | undefined> {
    const identityProvider = await this.prismaClient.identityProvider.findUnique({
      where: { id }
    })

    return identityProvider ? this.mapToIdentityProvider(identityProvider) : undefined
  }

  async getByName(name: string): Promise<IdentityProvider> {
    const identityProvider = await this.prismaClient.identityProvider.findUnique({
      where: { name }
    })

    if (!identityProvider) {
      throw new NotFoundError(`Identity provider with name ${name} not found.`)
    }

    return this.mapToIdentityProvider(identityProvider)
  }

  async tryGetByIssuerUrlAndAudience(issuerUrl: string, audience: string): Promise<IdentityProvider | undefined> {
    const identityProvider = await this.prismaClient.identityProvider.findUnique({
      where: {
        unique_issuer_audience: {
          issuerUrl,
          audience
        }
      }
    })
    
    return identityProvider ? this.mapToIdentityProvider(identityProvider) : undefined
  }

  async insert(identityProvider: IdentityProvider): Promise<void> {
    await this.prismaClient.identityProvider.create({
      data: this.mapToPrismaIdentityProvider(identityProvider)
    })
  }

  async update(identityProvider: IdentityProvider): Promise<void> {
    await this.prismaClient.identityProvider.update({
      where: { id: identityProvider.id, updatedAt: identityProvider.originalUpdatedAt },
      data: this.mapToPrismaIdentityProvider(identityProvider)
    })

    identityProvider.commit()
  }

  async delete(id: string): Promise<void> {
    await this.prismaClient.identityProvider.delete({
      where: { id }
    })
  }

  private mapToIdentityProvider(idp: PrismaIdentityProvider): IdentityProvider {
    return new IdentityProvider({
      id: idp.id,
      createdAt: idp.createdAt,
      updatedAt: idp.updatedAt,
      name: idp.name,
      issuerUrl: idp.issuerUrl,
      audience: idp.audience,
      identifierClaimName: idp.identifierClaimName,
      authSettings: idp.authSettingsType ? {
        type: idp.authSettingsType as IdentityProviderType,
        brand: idp.authSettingsBrand!,
        clientId: idp.authSettingsClientId!,
        clientSecret: this.encryptionProvider.decrypt(idp.authSettingsClientSecret!),
        redirectUrls: idp.authSettingsRedirectUrls || [],
        autoLinkUsers: idp.authSettingsAutoLinkUsers!,
        autoCreateUsers: idp.authSettingsAutoCreateUsers!
      } : null,
    })
  }

  private mapToPrismaIdentityProvider(idp: IdentityProvider): PrismaIdentityProvider {
    return {
      id: idp.id,
      createdAt: idp.createdAt,
      updatedAt: idp.updatedAt,
      name: idp.name,
      issuerUrl: idp.issuerUrl,
      audience: idp.audience,
      identifierClaimName: idp.identifierClaimName,
      authSettingsType: idp.authSettings?.type,
      authSettingsBrand: idp.authSettings?.brand,
      authSettingsClientId: idp.authSettings?.clientId,
      authSettingsClientSecret: idp.authSettings?.clientSecret ? this.encryptionProvider.encrypt(idp.authSettings?.clientSecret) : null,
      authSettingsRedirectUrls: idp.authSettings?.redirectUrls as string[] | undefined,
      authSettingsAutoLinkUsers: idp.authSettings?.autoLinkUsers,
      authSettingsAutoCreateUsers: idp.authSettings?.autoCreateUsers
    } as PrismaIdentityProvider
  }
}
